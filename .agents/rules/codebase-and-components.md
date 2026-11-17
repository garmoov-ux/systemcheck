---
trigger: always_on
---

# 코드베이스 구조 및 컴포넌트 모듈화 규칙

## 1. 1파일 1책임 (Single Responsibility) 및 모듈 단위 개발 원칙
코드가 짧더라도 한 파일에 여러 컴포넌트나 비즈니스 로직을 몰아넣지 않고, 역할별로 명확히 분리된 모듈/컴포넌트 단위로 개발한다.

### 파일 및 함수 크기 제한
- **UI 컴포넌트 (`.tsx`)**: 권장 200행 이내 (최대 300행 이내)
- **비즈니스/서비스 모듈 (`.ts`)**: 권장 200행 이내 (최대 300행 이내)
- **단일 함수 본문**: 권장 40행 이내 (최대 80행 이내)

## 2. 표준 디렉터리 및 모듈 아키텍처

```plaintext
src/
├── shared/                       # Main과 Renderer가 공유하는 순수 타입, 상수, IPC 채널 규격
│   ├── types/                    # 도메인 모델(장비 정보, 점검 결과, 이력, 설정, 통계 타입)
│   └── ipc-channels.ts           # 타입 안전한 IPC 채널명 정의
├── main/                         # Electron Main 프로세스 (Node.js 환경)
│   ├── index.ts                  # 앱 생명주기, 단일 인스턴스 락, 창/트레이 초기화
│   ├── tray.ts                   # 작업표시줄 트레이 아이콘 및 우클릭 컨텍스트 메뉴
│   ├── config/                   # 포터블 경로 해석(app-paths) 및 config.json 관리
│   ├── db/                       # SQLite(better-sqlite3) 초기화, 스키마, Repository
│   │   ├── connection.ts         # WAL 모드, pragma 설정, DB 연결
│   │   ├── schema.ts             # devices, check_history 테이블 및 인덱스 DDL
│   │   └── device-repo.ts        # 장비 목록 CRUD, 점검 이력 저장/검색, 통계 집계
│   ├── checker/                  # 비동기 병렬 장비 점검 엔진 및 원격 실행기
│   │   ├── network-probes.ts     # 비동기 Ping 및 TCP 포트(3389/5900), KeepAlive HTTP POST
│   │   ├── csv-sync.ts           # check/data.csv (CP949) 읽기/쓰기 및 기본 시드 생성
│   │   ├── check-scheduler.ts    # 병렬 워커 풀 기반 주기적/수동 장비 점검 스케줄러
│   │   ├── remote-launcher.ts    # 원격 데스크톱(mstsc.exe) 및 VNC 뷰어 원클릭 실행기
│   │   ├── file-logger.ts        # 일자별 system_check / device_check 로그 기록기
│   │   └── retention-cleaner.ts  # 오래된 로그 파일 및 점검 이력 자동 정리기
│   └── ipc/                      # 도메인별 IPC 핸들러 등록
├── preload/                      # ContextBridge 보안 브릿지
│   └── index.ts                  # window.systemCheckApi 노출
└── renderer/                     # React 19 + Tailwind CSS v4 프론트엔드
    ├── assets/fonts/             # Pretendard 오프라인 폰트 (.woff2)
    ├── components/
    │   ├── ui/                   # 원자적 공통 UI (PillButton, UtilityCard, OptionChip, SearchInput)
    │   └── layout/               # GlobalNav, StatusFooter
    ├── features/
    │   ├── dashboard/            # 실시간 점검 요약 타일, 장비 상태 그리드/테이블, 원격 연결 버튼
    │   ├── devices/              # 장비 등록/수정/삭제 및 파일 가져오기/내보내기 관리 화면
    │   ├── history/              # 점검 및 생존신호 전송 이력 조회 화면
    │   └── settings/             # 애플 시스템 환경설정 스타일 2단 세그먼트 설정 화면
    ├── hooks/                    # IPC 구독 및 상태 관리 커스텀 훅
    └── styles/                   # DESIGN.md 토큰 및 Pretendard 기반 글로벌 스타일
```
