---
trigger: always_on
---

# 테스트 및 품질 검증 규칙 (Testing & Verification)

## 1. 핵심 기능 단위 테스트 (`Vitest`) 필수
- **장비 목록 CSV(`CP949`) 동기화 테스트**:
  - `DeviceId,Ip,PortMS,PortVNC,CheckTime,Status` 형식의 `CP949` 인코딩 CSV 읽기/쓰기 및 깨짐 없는 한글/영문 호환성을 검증한다.
- **장비 상태 판정 및 네트워크 프로브 테스트**:
  - 로컬 테스트용 임시 TCP 서버를 띄워 포트 열림(`Up`) / 닫힘(`Down`) 판정과 지연 시간 측정, `KeepAlive` HTTP POST 요청 페이로드(`{"REGLTEQPMN_ID": ...}`) 전송이 정확히 동작하는지 테스트한다.
- **SQLite 데이터베이스 테스트**:
  - 인메모리 DB(`:memory:`)를 사용하여 장비 등록/수정/삭제, 점검 결과 일괄 갱신, 점검 이력 필터 검색 및 보관 기간 만료 데이터 정리 쿼리를 검증한다.

## 2. 구현 완료 전 필수 검증 절차 (Definition of Done)
코드를 수정하거나 기능을 구현한 뒤에는 반드시 아래 3단계를 실행하여 통과를 확인한다:
1. **타입 검사**: `npm run typecheck` (`tsc --noEmit`) 에러 0건
2. **단위/통합 테스트**: `npm test` (`vitest run`) 전체 통과
3. **빌드 및 패키징 검증**: `npm run dist:win` 실행 파일 생성 확인
