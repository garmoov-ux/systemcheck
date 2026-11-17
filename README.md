# SystemCheck - 무인교통단속장비 상태 점검 및 생존신호 전송 시스템 (v2.0)

무인교통단속장비의 네트워크 연결 상태(응답 확인, 원격 데스크톱 3389 포트, 원격 제어 VNC 5900 포트)를 고속 병렬로 점검하고, 가동 중인 장비의 센터 생존신호(`KeepAlive`)를 자동 전송하는 Windows 데스크톱 관제 애플리케이션입니다.

---

## 1. 주요 기능

1. **초고속 비동기 병렬 장비 점검**
   - 기존 단일 순차 점검 방식(110대 기준 10~20분 소요)을 비동기 워커 풀 병렬 점검(기본 15대 동시 점검)으로 개선하여 수 초 내에 전체 단속장비 상태를 점검합니다.
   - 원격 데스크톱(`3389`) 또는 원격 제어 VNC(`5900`) 포트 중 1개 이상 열려 있는 경우 정상 가동(`Up`), 모두 닫혀 있는 경우 연결 끊김(`Down`)으로 판정합니다.

2. **센터 생존신호(`KeepAlive`) 자동 전송**
   - 포트 연결이 확인된 장비에 대해 센터 수신 서버(`http://192.168.9.113:8088/api/v2/KeepAlive`)로 `{"REGLTEQPMN_ID": "<장비번호>"}` 신호를 전송하고 응답 코드를 기록합니다.
   - 기존 방식(열린 포트마다 전송)과 개선 방식(장비당 1회 전송)을 설정에서 선택할 수 있습니다.

3. **기존 운영 파일(`check/data.csv` · 일자별 로그) 100% 호환 및 단독 실행**
   - `check/data.csv` (`CP949` 인코딩, `DeviceId,Ip,PortMS,PortVNC,CheckTime,Status`) 파일과 내장 데이터베이스(`data/app.db`)를 실시간 양방향 동기화합니다.
   - 포터블 단일 실행 파일(`SystemCheck_Portable.exe`)만 원하는 폴더에 복사해 실행하더라도 `config.json`, `check/data.csv`(기본 110대 장비 시드), `data/app.db`, `log/` 폴더를 스스로 생성하여 즉시 동작합니다.

4. **원클릭 원격 접속 및 작업표시줄 트레이 상주**
   - 대시보드 목록에서 **원격 데스크톱** 클릭 시 Windows 내장 `mstsc.exe /v:<IP>:<PortMS>`가 즉시 실행되며, **VNC 연결** 클릭 시 VNC 뷰어로 즉시 연결됩니다.
   - 창 닫기(`X`) 클릭 시 작업표시줄 트레이로 숨겨져 백그라운드 주기 점검을 계속 수행하며, 트레이 아이콘 우클릭 메뉴에서 **프로그램 완전 종료**를 실행할 수 있습니다.

---

## 2. 기술 스택

- **Runtime & Desktop**: Electron 34, Node.js
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Pretendard 오프라인 내장 폰트
- **Database**: SQLite (`better-sqlite3`, WAL 모드)
- **Testing & Packaging**: Vitest, Electron-Vite, Electron-Builder (`NSIS` 설치형 & `Portable` 단일 실행 파일)

---

## 3. 개발 및 빌드 명령어

```bash
# 1. 의존성 설치
npm install

# 2. 타입 검사 및 단위 테스트 실행
npm run typecheck
npm test

# 3. 개발 모드 실행
npm run dev

# 4. Windows 배포용 실행 파일 빌드 (release/SystemCheck_Portable.exe, SystemCheck_Setup.exe)
npm run dist:win
```

---

## 4. 개발 및 기술지원

- **개발·기술지원**: ㈜이노네트웍스 강홍선 (`s_gain@naver.com`)
