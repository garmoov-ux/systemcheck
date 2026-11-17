# SystemCheck - 무인교통단속장비 상태 점검 및 생존신호 전송 시스템 (v2.0.0)

- **개발·기술지원**: ㈜이노네트웍스 강홍선 (`s_gain@naver.com`)

무인교통단속장비의 네트워크 연결 상태(**응답 확인**, **원격 데스크톱 포트 `3389`**, **원격 제어 포트 `5900`**)를 비동기 병렬로 고속 점검하고, 정상 가동 중인 장비의 센터 생존신호(`KeepAlive`)를 자동 전송하는 Windows 10+ 전용 데스크톱 관제 애플리케이션입니다.

---

## 1. 배포 및 단독 실행 안내 (`SystemCheck_Portable.exe`)

빌드 완료 후 `release/SystemCheck_Portable.exe` **파일 1개만** 원하는 폴더에 복사하여 바로 사용할 수 있습니다.
- 실행 파일 이름을 `SystemCheck.exe` 등 원하는 이름으로 변경해도 정상 동작합니다.
- 최초 실행 시 실행 파일이 위치한 폴더를 기준으로 아래 파일과 폴더를 스스로 자동 생성합니다:
  - `config.json`: 환경 설정 파일 (`./log` 상대경로 기본 적용)
  - `data/app.db`: 내장 데이터베이스 파일 (초기 110대 장비 목록 자동 시드, 장비명·IP·포트·실시간 상태 및 점검 이력 저장)
  - `log/`: 일자별 상세 한글 로그(`YYYYMMDD_system_check.log`, `YYYYMMDD_device_check.log`) 기록 폴더

---

## 2. 핵심 기능 및 개선 사항

1. **초고속 비동기 병렬 장비 점검 및 실시간 카운트다운**
   - 기존 단일 순차 점검 방식(110대 기준 10~20분 소요)을 **동시 병렬 점검 워커 풀(기본 15대 동시 점검)**로 개선하여 수 초 내에 전체 단속장비 상태를 점검합니다.
   - 원격 데스크톱 포트(`3389`) 또는 원격 제어 포트(`5900`) 중 1개 이상 열려 있는 경우 **정상 가동(`Up`)**, 모두 닫혀 있는 경우 **연결 끊김(`Down`)**으로 판정합니다.
   - 상단 요약 타일 우측의 **자동 주기 점검 카운트**에서 다음 점검까지 남은 시간(초)과 누적 점검 회차, 실시간 점검 진행 대수(`15/110 점검중`)를 즉시 확인할 수 있습니다.

2. **센터 생존신호(`KeepAlive`) 자동 전송**
   - 포트 연결이 확인된 장비에 대해 센터 수신 서버(`http://192.168.9.113:8088/api/v2/KeepAlive`)로 `{"REGLTEQPMN_ID": "<장비번호>"}` 신호를 전송하고 응답 코드를 기록합니다.
   - **열린 포트별 전송(기존 호환)** 또는 **장비당 1회 전송** 방식을 환경 설정에서 선택할 수 있습니다.

3. **장비명(`deviceName`) 관리 및 내장 데이터베이스 + CSV 호환**
   - **장비 목록 관리** 화면에서 장비번호, **장비명(설치 위치·별칭)**, IP 주소, 원격 데스크톱 포트, 원격 제어 포트를 등록·수정·삭제할 수 있습니다.
   - **장비 목록 파일 가져오기 / 내보내기**를 통해 기존 6컬럼(`DeviceId,Ip,PortMS,PortVNC,CheckTime,Status`)과 장비명이 포함된 7컬럼(`DeviceId,DeviceName,Ip,...`) CSV 파일을 모두 호환 지원합니다.

4. **원클릭 원격 접속 및 고정 뷰포트(`1360 × 860`) 관제 UI**
   - 장비 행에서 **[원격 데스크톱]** 클릭 시 Windows 내장 `mstsc.exe /v:<IP>:<PortMS>`가 즉시 연결되며, **[원격 제어]** 클릭 시 원격 제어 프로그램이 실행됩니다.
   - `1360 × 860` 고정 창 크기, 오프라인 내장 `Pretendard` 폰트, 전 테이블 **컬럼 헤더 클릭 오름·내림차순 정렬**을 지원합니다.

5. **상세 한글 로깅 및 작업표시줄 트레이 상주**
   - 일자별 로그 파일(`YYYYMMDD_system_check.log`, `YYYYMMDD_device_check.log`)에 `[시스템점검]`, `[장비상세]` 구분자와 `[정보]`, `[주의]`, `[오류]` 등급으로 포트 연결 지연시간, 생존신호 전송 결과, 회차별 요약 통계를 상세한 한글로 기록합니다.
   - 창 닫기(`X`) 클릭 시 작업표시줄 트레이로 숨겨져 백그라운드 주기 점검을 계속 수행하며, 트레이 우클릭 메뉴의 **[프로그램 완전 종료]**로 안전하게 종료할 수 있습니다.

---

## 3. 설정 파일 (`config.json`) 규격

프로그램 폴더 내부 경로는 `./log` 상대경로로 자동 인식되어 폴더 이동 시에도 그대로 동작합니다.

```json
{
  "paths": {
    "logDir": "./log",
    "vncViewerPath": ""
  },
  "checker": {
    "intervalSec": 100,
    "concurrency": 15,
    "tcpTimeoutSec": 3,
    "autoStartOnLaunch": true
  },
  "keepAlive": {
    "enabled": true,
    "url": "http://192.168.9.113:8088/api/v2/KeepAlive",
    "timeoutSec": 3,
    "sendMode": "per_open_port"
  },
  "retention": {
    "logDays": 30,
    "dbHistoryDays": 30
  },
  "system": {
    "minimizeToTrayOnClose": true
  }
}
```

---

## 4. 개발 및 빌드 명령어

```powershell
# 1. 저장소 복제 및 의존성 설치
git clone https://github.com/garmoov-ux/systemcheck.git
cd systemcheck
npm install

# 2. 타입 검사 및 단위 테스트 실행
npm run typecheck
npm test

# 3. 개발 모드 실행
npm run dev

# 4. Windows 배포용 실행 파일 빌드 (release/SystemCheck_Portable.exe, SystemCheck_Setup.exe)
npm run dist:win
```
