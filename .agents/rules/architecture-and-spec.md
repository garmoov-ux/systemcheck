---
trigger: always_on
---

# SystemCheck 아키텍처 및 무인교통단속장비 상태 점검 명세 규칙

본 규칙은 기존 `legacy_src/app.py` 운영 로직과 `./check/data.csv` 데이터 규격을 기준으로 정의한다.

## 1. 장비 목록(`check/data.csv`) 규격 및 양방향 동기화
1. **파일 인코딩**: `CP949` (읽기 시 `UTF-8` BOM 및 `CP949` 자동 감지, 저장 시 `CP949`로 기록하여 기존 운영 환경과 100% 호환)
2. **컬럼 구조**: `DeviceId,Ip,PortMS,PortVNC,CheckTime,Status`
   - `DeviceId`: 장비번호 (예: `B0041`, `F9999`)
   - `Ip`: 장비 IPv4 주소 (예: `50.11.30.100`)
   - `PortMS`: 원격 데스크톱(MSTSC/RDP) 포트 (기본 `3389`)
   - `PortVNC`: 원격 제어(VNC) 포트 (기본 `5900`)
   - `CheckTime`: 최종 점검 시각 (`YYYY-MM-DD HH:mm:ss`)
   - `Status`: 장비 상태 (`Up` 또는 `Down`)
3. **자동 생성 및 초기 시드**:
   - 실행 파일만 단독 배포된 환경에서도 `./check/data.csv`가 없으면 기본 장비 목록으로 자동 생성하며, SQLite `devices` 테이블과 실시간 양방향 동기화한다.

## 2. 장비 상태 점검 및 판정 로직
1. **ICMP 응답 확인 (Ping)**:
   - Windows `ping -n 1 -w <timeoutMs> <ip>`를 비동기 실행하여 응답 여부(`pingOk`)와 지연 시간(`latencyMs`)을 측정한다.
2. **TCP 포트 연결 확인 (`PortMS`, `PortVNC`)**:
   - Node.js `net.Socket`을 사용해 설정된 타임아웃(기본 3~5초) 내에 `PortMS`(3389) 및 `PortVNC`(5900) TCP 핸드셰이크 성공 여부(`msPortOpen`, `vncPortOpen`)를 검사한다.
3. **정상/비정상(`Up` / `Down`) 판정**:
   - 기존 `legacy_src/app.py` 판정 기준과 동일하게, **`PortMS` 또는 `PortVNC` 중 최소 1개 이상의 포트가 열려 있으면 `Up`(정상)**, 두 포트 모두 닫혀 있으면 `Down`(비정상)으로 판정한다.
4. **센터 생존신호(`KeepAlive`) 전송**:
   - 포트 연결 성공 시 설정된 센터 URL(기본 `http://192.168.9.113:8088/api/v2/KeepAlive`)로 HTTP POST 요청을 전송한다.
   - 요청 본문(JSON): `{"REGLTEQPMN_ID": "<DeviceId>"}`
   - 기존 레거시의 중복 전송 문제를 방지하기 위해 장비당 1회 전송(또는 열린 포트별 전송 옵션)과 HTTP 타임아웃을 지원한다.

## 3. 일자별 운영 로그 기록
- `./log/YYYYMMDD_system_check.log`: 시스템 시작/종료, 주기 점검 시작/완료 요약 로그
- `./log/YYYYMMDD_device_check.log`: 장비별 핑 결과, 포트 연결 성공/실패, 생존신호 전송 응답코드, 최종 상태(`Up`/`Down`) 상세 로그
