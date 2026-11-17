# SystemCheck 프로젝트 작업 및 코딩 아키텍처 표준 규칙 (AGENTS.md)

본 문서는 `SystemCheck` 워크스페이스의 마스터 지침서이며, 세부 분야별 규칙은 `.agents/rules/` 하위 6개 규칙 파일과 `DESIGN.md`를 따른다.

## 0. 세부 규칙 파일 참조 체계 (`.agents/rules/`)
1. **`architecture-and-spec.md`**: 무인교통단속장비 상태 점검(Ping, 원격 데스크톱 3389 포트, VNC 5900 포트), 센터 생존신호(`KeepAlive`) HTTP POST 전송, `check/data.csv`(`CP949`) 양방향 동기화 명세
2. **`codebase-and-components.md`**: 1파일 1컴포넌트/1모듈 원칙, 파일/함수 줄 수 제한, `main` / `preload` / `renderer` / `shared` 폴더 아키텍처
3. **`design-system.md`**: `DESIGN.md`(Apple Design System) 기반 컬러(`#0066cc`, `#f5f5f7`, `#1d1d1f`, `#272729`), 고정 뷰포트(`h-screen overflow-hidden`), Pretendard 오프라인 내장 폰트, 100% 한글화 UI 규칙
4. **`security-and-env.md`**: `.env` / `.env.example` 환경변수 분리, Electron `contextIsolation: true`, SQLite Prepared Statement 및 `WAL` 모드 보안 규칙
5. **`testing-and-verification.md`**: 비동기 병렬 점검 엔진, `CP949` `data.csv` 동기화, 인메모리 SQLite 테스트, 빌드 검증 절차
6. **`git-workflow.md`**: `<type>(<scope>): <한글 커밋 요약>` 커밋 컨벤션 및 저장소 보안 규칙

## 1. 언어 및 커뮤니케이션 스타일
- 모든 설명, 코드 주석, 보고서(Artifact), 커밋 메시지 요약은 한국어로 작성한다.
- 문서와 코드 주석에는 이모지(Emoji)를 사용하지 않는다.
- 화면 UI에는 영문 기술 용어(`SQLite`, `CSV`, `Ping`, `Timeout`, `KeepAlive` 등) 대신 직관적인 순수 한글 레이블(`응답 확인`, `생존신호`, `원격 데스크톱`, `원격 제어` 등)을 우선 사용한다.

## 2. 도메인 핵심 원칙 (장비 점검 및 센터 생존신호 호환성)
- 기존 `check/data.csv` (`CP949`, 컬럼: `DeviceId,Ip,PortMS,PortVNC,CheckTime,Status`) 포맷과 일자별 로그(`YYYYMMDD_system_check.log`, `YYYYMMDD_device_check.log`) 형식을 100% 호환 유지한다.
- 기존 순차 점검의 병목(110대 점검 시 10~20분 소요)을 비동기 병렬 워커 풀(기본 15대 동시 점검)로 개선하여 수 초 내에 전체 장비를 점검한다.
- 포트 연결 성공 시 센터 서버(`http://192.168.9.113:8088/api/v2/KeepAlive`)로 `{"REGLTEQPMN_ID": "<장비번호>"}` JSON 페이로드를 전송한다.

## 3. 컴포넌트 및 모듈 단위 개발 원칙
- 한 파일에 여러 컴포넌트나 비즈니스 로직을 몰아넣지 않고, 원자적 UI 컴포넌트(`components/ui/`), 레이아웃(`components/layout/`), 도메인 기능(`features/`), 백엔드 서비스(`checker/`, `db/`, `config/`)로 모듈화하여 개발한다.
- UI 컴포넌트(`.tsx`) 및 서비스 모듈(`.ts`)은 권장 200행(최대 300행) 이내, 단일 함수는 권장 40행(최대 80행) 이내로 유지한다.
