# AI-First Development: 왜 프레임워크는 AI-First여야 하는가

- **버전**: v0.1
- **작성일**: 2025-08-20
- **라이선스**: MIT
- **상태**: Beta – 커뮤니티 피드백 수렴 및 Early Adopter 온보딩

## Executive Summary

기존 프레임워크는 **인간 개발자**를 1차 사용자로 가정한다. 이 구조 위에 AI를 “보조”로 덧대면, 사람을 위한 보일러와 AI 검증이 **중복**되어 속도·품질·비용이 분열된다.

**AI-First Framework**는 반대로 **AI를 1급 시민**으로 상정한다. 내부 로직은 단순화하고, **신뢰 경계**(사용자/네트워크/외부 API)에서의 **런타임 검증·계약 테스트·보안 스캔**을 **프레임워크 자체의 규범**으로 내장한다. 또한 **프롬프트/모델 버전 잠금**, **감사 가능한 파이프라인**, **품질 게이트**가 기본값이다.

핵심 명제: *AI를 보조로 붙이면 이중 비용, 프레임워크를 AI-First로 바꾸면 속도·품질·비용을 동시에 개선*한다.

---

## 0. 목적·범위·전제

- **목적**: IT/AI 업계 의사결정자·프레임워크 제작자에게 *왜 프레임워크가 AI-First여야 하는지*를 비즈니스/기술 인과사슬로 설득하고, 즉시 도입 가능한 규범을 제시.
- **범위**: 일반 웹/모바일/엔터프라이즈 앱 신규/확장(자율성 **L2~L4**). 고위험 도메인(금융/의료/산업제어)은 **강화 프로파일** 적용.
- **전제**: (a) 허용 모델/호스팅 레지스트리, (b) 데이터 레지던시/보존 정책, (c) 코드·프롬프트 **버전 관리**.

---

## 1. 왜(Why): 비즈니스 인과사슬

| 비즈니스 목표 | 프레임워크 변화(메커니즘) | 검증 지표 |
| --- | --- | --- |
| 출시 주기 단축 | **내장 품질 게이트**(경계 검증/계약/보안) | Lead Time, 배포 빈도 |
| 실패율 감소 | 결정성 구성·골든세트 회귀·점진 배포/자동 롤백 | Change Failure Rate, MTTR |
| 비용 억제 | 모델 어댑터·캐시/RAG·쿼터·폴백 표준화 | 요청당 비용, 추론비/빌드비 비율 |
| 감사·규제 대응 | 프롬프트/모델 **버전 잠금** + **감사 로그 스키마** | 감사 쿼리 리드타임, 증빙 충족률 |

---

## 2. 무엇(What): AI-First Framework 불변식/비목표/자율성

**불변식(Invariants)**

1. 경계 입력 **100% 런타임 검증**(JSON Schema/Zod/Valibot)
2. 프롬프트/모델/도구 **버전 잠금**(결정성 포함)
3. **품질 게이트 통과만** 배포 경로(수동 우회 금지)
4. **점진 배포/자동 롤백** 상시 가능

**비목표(Non-Goals)**: 경계 검증 축소·보안/라이선스/시크릿 스캔 축소·“테스트 줄이기” 자체는 목표가 아님(→ **정보량 높은 테스트**로 재구성).

**자율성 레벨**

| 레벨 | 범위 | 필수 가드레일 |
| --- | --- | --- |
| L2 | 모듈 생성/수정 | 경계 검증, 계약 테스트, 품질 게이트 |
| L3 | 기능 단위 | + 보안/라이선스/시크릿 스캔, 승인 |
| L4 | 서비스 단위 | + 골든세트 회귀, 점진 배포·자동 롤백 |

---

## 3. 어떻게(How): 레퍼런스 아키텍처

**구성**: Model Adapter(멀티·폴백), Prompt Registry(버전·해시), Boundary Validator(스키마·계약), Policy Engine(SAST/DAST/Deps/License/Secrets), Test Orchestrator(계약·메타모픽·속성), Release Manager(결정성/카나리/롤백), Observability(구조화 로그: {model, version, promptHash, outputHash, cost, latency}).

**파이프라인**

```mermaid
graph LR
  A[요구사항] --> B[AI 코드 생성]
  B --> C[TS/정적 분석]
  C --> D[경계 검증(JSON Schema) & 계약 테스트]
  D --> E[보안/시크릿/라이선스 스캔]
  E --> F{품질 게이트}
  F -->|통과| G[점진 배포]
  F -->|실패| B
  G --> H[골든세트 회귀]
  H -->|회귀 없음| I[자동 확장]
  H -->|회귀 탐지| J[자동 롤백]

```

**프레임워크 1급 API(개념)**

- `framework.boundary.schema(route, jsonSchema)`
- `framework.test.contract(provider, spec)`
- `framework.policy.enable(['sast','deps','license','secrets'])`
- `framework.ai.registerPrompt(name, {model, version, temperature:0})`
- `framework.release.canary({percent:5}).withGoldenSet(name).onRegression(rollback)`

---

## 4. 설계 원칙

- 내부 로직 **단순화**(TS/정적 분석 중심), **경계 강화**, **컴포넌트 우선**(Shadow DOM/CSS Modules + 디자인 토큰, 전역 구조 선택자 최소화).

---

## 5. 테스트 전략(정보량 극대화)

- **계약 테스트**: 외부 API/스키마 합의 고정
- **메타모픽 테스트**: 의미보존 변형에도 성질 유지
- **속성 기반 테스트**: 금지 패턴 검증(위험 SQL/민감 로그)
- 커버리지는 **결과 지표**일 뿐, 목적은 **테스트 정보량**.

---

## 6. 보안·규제·거버넌스(LLM 특화)

- **위협**: 프롬프트 인젝션/간접 인젝션, 컨텍스트 오염, 시크릿/PII 유출, 취약 코드 제안, 공급망(패키지/라이선스).
- **통제**: 컨텍스트 필터·입력 정규화·툴 화이트리스트, SAST/DAST/Deps/License/Secrets **게이트**, 데이터 분류/마스킹/보존, **허용 모델 레지스트리**, **감사 로그 스키마 표준**.

---

## 7. 경제성·메트릭

- **역설**: AI 보조만 붙이면 추론비↑ + 외부 검증체인 유지로 **중복 비용↑**.
- **해법**: 프레임워크가 게이트·어댑터·캐시/RAG/결정성을 **내장**해 중복 제거.
- **측정 세트**: DORA(Lead Time/Deploy Freq/Change Failure/MTTR) + AI 특화(프롬프트 회귀율, 추론비/빌드비 비율, 게이트 재시도율, 요청당 비용).

---

## 8. 도입 전략(엔터프라이즈/벤더)

**엔터프라이즈 로드맵**

- Phase 1(1–2개월): 신규 기능 **L2**, KPI: 리드타임 −30%, 회귀버그 −40%
- Phase 2(3–6개월): 도메인 확산 **L3**, KPI: 계약 테스트 ≥80%, 게이트 1회 통과율 ≥85%
- Phase 3(6–12개월): 핵심 서비스 **L4**, KPI: 모델 변경 MTTR < 1일, 비용/성능 SLO ≥99%

**프레임워크 벤더 로드맵**

- v1: Boundary Schema/계약/정책 게이트
- v2: Prompt Registry/Model Adapter/버전 잠금
- v3: 골든세트 회귀/점진 배포·자동 롤백/비용 대시보드

**Go/No-Go 체크리스트(발췌)**

- 데이터/시크릿 분류 문서화 & 자동 점검
- **MVG 7종** 자동화(우회 금지)
- 구조화 로그·비용 대시보드
- 점진 배포·자동 롤백 검증
- Phase-1 KPI 합의(수치·기간·대조군)

---

## 9. 반론과 응답(FAQ)

- **린터 불필요?** 핵심 보안/취약 룰은 유지. 모델 변경 시 회귀 필요.
- **테스트 줄여도?** 양이 아닌 **정보량**. 계약/메타모픽/속성 기반이 더 강한 보증.
- **즉시 배포?** **게이트 통과 시 자동 배포**가 기본, 우회 금지.
- **벤더 종속?** 어댑터/표준 인터페이스/골든세트 회귀로 스왑 비용 최소화.

---

## 10. Early Adopter 사례(익명·합성)

> 아래는 복수 팀의 패턴을 합성한 예시입니다. v1.0에서는 실측 사례로 치환 예정.
> 

**A사(대규모 B2C 웹)**

- 변경: 프레임워크 **내장 경계 스키마/계약 테스트**, Prompt Registry 도입
- 8주 결과: **Lead Time −68%**, 배포 빈도 **+2.4×**, 추론비 **−41%**(캐시/RAG/결정성), Change Failure **−52%**

**B사(SaaS 백오피스)**

- 변경: Policy Gate(SAST/DAST/Deps/License/Secrets) + L3 자율성
- 6주 결과: **Change Failure −83%**, MTTR **−46%**, 품질 게이트 1회 통과율 **88%**

**C사(엔터프라이즈 내장형 앱)**

- 변경: Model Adapter 다중화(벤더 A/B + 로컬), 카나리+자동 롤백
- 10주 결과: 가용성 **+0.9pp**, 비용/성능 SLO 준수 **>99%**, 모델 교체 리드타임 **−72%**

> 교훈: “보조 AI”가 아니라 프레임워크 내장 규범이 결과를 만든다.
> 

---

## 11. 레거시 마이그레이션 가이드(부록 D 요약)

**전략**: **Strangler Fig**(점진적 포위) + **이중 파이프라인**(구/신 공존)

1. **경계 스키마 우선 적용**: 기존 엔드포인트에 JSON Schema/Zod만 먼저 붙인다(비파괴).
2. **계약 테스트 계층화**: 외부 의존 API부터 계약 고정 → 내부 모듈로 확대.
3. **Policy Gate 삽입**: CI에 SAST/DAST/Deps/License/Secrets를 “경고→차단” 두 단계로 도입.
4. **Prompt Registry 롤인**: 고빈도 프롬프트부터 버전 잠금/결정성 적용.
5. **카나리/골든세트**: 신/구 경로 AB → 회귀 무시점까지 트래픽 증분.
6. **롤백 플레이북**: 트래픽 절체, 캐시 무효화, 스키마 리버전, 장애 포스트모텀 표준.

**CI/CD 통합 스니펫(개념)**

```yaml
# .github/workflows/ai-first.yml
jobs:
  build:
    steps:
      - run: npm run typecheck
      - run: fw boundary verify
      - run: fw test:contract && fw test:metamorphic && fw test:property
      - run: fw policy gate --fail-on-findings
      - run: fw ai eval --golden-set core
      - run: fw release canary --percent 5

```

---

## 12. Tool Ecosystem(부록 E 요약)

- **IDE**: VSCode/JetBrains 플러그인(프롬프트 레지스트리·스키마 인텔리센스)
- **CI/CD**: GitHub Actions/GitLab CI/CircleCI
- **모니터링**: Datadog/New Relic/Grafana(코스트·지연 태그 표준)
- **SAST/DAST**: CodeQL/Semgrep, OWASP ZAP
- **Deps/License/Secrets**: Snyk/FOSSA/Trufflehog/Gitleaks
- **Schema/Contract**: Zod/Valibot/Ajv, Pact/SchemaHero
- **벡터/RAG**: pgvector/Pinecone/Weaviate
- **모델**: OpenAI/Anthropic/Google/Cohere/로컬(vLLM/llama.cpp)

---

## 13. Legal/Compliance(부록 F 요약)

- **GDPR/CCPA**: 데이터 분류·최소수집·보존/삭제·DSAR 대응, 컨트롤러/프로세서 구분
- **SOC2**: 신뢰 기준(보안/가용성/기밀성/프라이버시)→ 파이프라인 통제 매핑(게이트·감사로그·접근권한)
- **산업별**: 금융(PCI DSS), 의료(HIPAA) 등은 **강화 프로파일**(추가 승인·샌드박스·키 관리 HSM) 적용

---

## 14. MVG(최소 가드레일) 7종 체크리스트

1. 경계 스키마 검증 2) 계약 테스트 3) 메타모픽 테스트 4) SAST/DAST/Deps/License/Secrets
2. 프롬프트/모델 버전 잠금·결정성 6) 골든세트 회귀 7) 폴백/회로 차단/캐시

---

## 15. 버전 전략

- **지금**: v0.9(Beta) 발행 → 커뮤니티/얼리어댑터 온보딩(2주)
- **v1.0(GA)**: 실측 Success Story ≥3, 마이그레이션 가이드 확장, Production 체크리스트 검증
- **v1.1+**: 도구 통합 심화, 산업별 프로파일, 인증 가이드

---

## 16. 배포 전 최종 체크리스트

```
□ Success Story(익명 합성 → 실측으로 치환 계획 명시)
□ Migration Guide(롤백 플레이북 포함)
□ 코드 예시 최소 1개 실행 검증
□ 법무 검토(책임 한계/라이선스/데이터 정책)
□ 커뮤니티 피드백 채널/이슈 템플릿
□ 영문 버전 동시 공개
□ 공식 웹/레포(README: MVG 7종, Quickstart)

```

---

## 결론

프레임워크가 AI-First가 아니면 AI는 **항상 외부자**로 남고, 중복 파이프라인이 비용·속도·품질을 갉아먹는다. **경계-중심 검증**과 **감사 가능한 파이프라인**을 프레임워크의 **내장 규범**으로 제공할 때, 단순함은 비로소 **속도와 신뢰성**이 된다.

**요약 한 줄**: *AI와 경쟁하지 말고, **프레임워크를 AI를 위해 설계**하라 — 단, 경계에서는 반드시 검증하라.*