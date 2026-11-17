---
trigger: always_on
---

# UI/UX 디자인 시스템 규칙 (DESIGN.md 준수)

프론트엔드(`src/renderer/`)의 모든 화면과 컴포넌트는 프로젝트 루트의 `DESIGN.md`에 정의된 디자인 철학과 토큰을 엄격히 준수한다.

## 1. 데스크톱 고정 뷰포트 및 한글화 원칙
- **전체 페이지 스크롤 금지**: 최상위 레이아웃은 `h-screen overflow-hidden flex flex-col select-none`으로 고정하며, 테이블/목록 영역만 내부 스크롤(`flex-1 min-h-0 overflow-y-auto`)한다.
- **100% 자연스러운 한글 UI**: `SQLite`, `CSV`, `Ping`, `KeepAlive`, `PortMS`, `Timeout` 등 영문 개발 용어를 화면에 직접 노출하지 않고 `내장 데이터베이스`, `장비 목록 파일`, `응답 확인`, `생존신호`, `원격 데스크톱`, `연결 제한시간` 등 자연스러운 한글 표현을 사용한다.
- **줄바꿈 깨짐 방지**: 버튼, 탭, 뱃지, 테이블 헤더, 설정 항목 제목에는 `whitespace-nowrap`을 적용해 어색한 두 줄 개행이 발생하지 않도록 한다.
- **오프라인 내장 폰트**: `src/renderer/assets/fonts/Pretendard-*.woff2` (`400`, `500`, `600`, `700`)를 번들링하여 어떤 Windows PC에서도 일관된 타이포그래피를 제공한다.

## 2. 컬러 시스템 (Colors)
- **단일 브랜드 액센트 (Single Accent)**:
  - Action Blue (`#0066cc`): 모든 주요 버튼(Primary Pill CTA), 활성 탭, 활성 세그먼트에 사용하는 유일한 브랜드 컬러
  - Focus Blue (`#0071e3`): 키보드 포커스 링 (`outline: 2px solid #0071e3`)
  - Sky Link Blue (`#2997ff`): 다크 타일(`#272729`) 위에서만 사용하는 텍스트/수치 강조 블루
- **배경 및 표면 (Surfaces)**:
  - Pure White (`#ffffff`): 기본 유틸리티 카드, 테이블 컨테이너, 입력창 배경
  - Parchment (`#f5f5f7`): 앱 기본 캔버스 배경 및 그룹 박스 배경
  - Pearl Button (`#fafafc`): 보조 캡슐 버튼 배경
  - Near-Black Tile (`#272729`): 상단 핵심 요약 다크 히어로 타일
  - Pure Black (`#000000`): 최상단 글로벌 네비게이션 바(`height: 48px`)
- **텍스트 및 보더 (Text & Hairlines)**:
  - Near-Black Ink (`#1d1d1f`): 기본 헤드라인 및 본문 텍스트
  - Muted Text (`#7a7a7a` / 다크 위 `#cccccc`): 캡션, 타임스탬프, 부가 설명
  - Hairline Border (`#e0e0e0`): 유틸리티 카드의 1px 실선 테두리

## 3. 형태 및 인터랙션 (Shapes & Micro-interactions)
- 배경이나 버튼에 장식용 CSS 그라데이션이나 불필요한 그림자를 사용하지 않는다.
- 유틸리티 카드 라디우스는 `18px`(`rounded-[18px]`), 주요 액션 버튼과 검색창은 `rounded-full`, 설정 선택기는 애플 시스템 환경설정 스타일의 세그먼트 컨트롤(`bg-[#e8e8ed] rounded-[10px]`)을 사용한다.
