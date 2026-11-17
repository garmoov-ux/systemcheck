---
trigger: always_on
---

# Git 워크플로우 및 커밋 컨벤션 규칙

## 1. 커밋 메시지 포맷
모든 Git 커밋 메시지는 아래 형식을 따른다.

```plaintext
<type>(<scope>): <한글 커밋 요약>

[선택적 본문: 변경 이유 및 상세 내용 (한글)]
```

### 허용되는 Type 8종
- `feat`: 새로운 기능 추가 (예: `feat(checker): 비동기 병렬 장비 점검 엔진 구현`)
- `fix`: 버그 및 예외 처리 수정
- `docs`: 문서 및 README 수정
- `refactor`: 기능 변경 없는 코드 구조 개선 및 모듈 분리
- `perf`: 성능 및 메모리 최적화
- `style`: 코드 포맷팅, 스타일 수정
- `test`: 단위 테스트 및 통합 테스트 추가/수정
- `chore`: 빌드 설정, 패키지 의존성, `.gitignore`, 에이전트 규칙 설정

## 2. 저장소 보안 및 대용량 파일 관리
- `.env`, 데이터베이스 파일(`*.db`, `*.db-wal`, `*.db-shm`), 실시간 로그(`log/`), 일자별 백업 CSV(`check/data_*.csv`), 대용량 바이너리(`SystemCheck.exe`, `viewer/`, `release/`)는 절대 Git에 커밋하지 않는다.
