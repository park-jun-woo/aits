# AITS Framework

> AI의, AI에 의한, AI를 위한 최초의 프레임워크
> "AITS, build my idea."

\*\*AITS (AI-driven TypeScript Stack)\*\*는 개발자가 아닌, \*\*개발 AI 에이전트(Development AI Agent)\*\*와의 소통을 최우선으로 설계된 혁신적인 SPA(단일 페이지 애플리케이션) 프레임워크입니다. AI가 가장 이해하기 쉽고, 가장 생성하기 쉬우며, 가장 완벽하게 제어할 수 있는 구조를 통해 웹 개발의 생산성을 극대화하는 것을 목표로 합니다.

## 🔮 핵심 철학 (Core Philosophy)

AITS는 복잡한 자유도 대신, 예측 가능한 구조와 패턴을 제공하여 AI와 개발자 모두의 실수를 줄이고 협업 효율을 높입니다.

### 🤖 AI 친화적 설계 (AI-Friendly Design)

AI는 명확하고 구조화된 패턴을 따를 때 가장 좋은 코드를 생성합니다. AITS의 모든 구성 요소는 AI가 쉽게 학습하고 예측 가능한 코드를 생성할 수 있도록 설계되었습니다.

### 📜 선언적 프로그래밍 (Declarative Programming)

"어떻게"를 지시하는 복잡한 코드 대신, `<ai-list>`, `<ai-form>` 같은 웹 컴포넌트와 헬퍼 메소드를 통해 "무엇"을 원하는지만 선언합니다.

### 🏛️ 예측 가능한 아키텍처 (Predictable Architecture)

Controller, Model, ApiAdapter 등 모든 기능은 정해진 위치와 패턴을 따릅니다. AI는 새로운 기능을 추가할 때 어디를 어떻게 수정해야 할지 명확하게 압니다.

### 🧩 강력한 추상화 (Powerful Abstraction)

API 통신, 상태 관리, 리소스 로딩 등 복잡한 작업은 프레임워크가 내부적으로 처리합니다. AI와 개발자는 오직 비즈니스 로직에만 집중할 수 있습니다.

## 🚀 5분 만에 시작하기 (Quick Start)

AITS는 `ai-cli` 도구를 통해 프로젝트 생성을 자동화합니다. (CLI는 향후 제공될 예정입니다)

1.  **AITS 프로젝트 생성:**

    ```bash
    npx ai-cli new my-blog-project
    ```

2.  **`routes.ts` 파일에 라우트 추가:**
    AI에게 지시하거나 직접 작성합니다.

    ```typescript
    // /src/app/routes.ts
    export default [
        { path: '/', controllerPath: '/app/controllers/HomeController.js', methodName: 'showHome' }
    ];
    ```

3.  **`HomeController.ts` 작성:**

    ```typescript
    // /src/app/controllers/HomeController.ts
    import { Controller, Context } from '../framework';

    export default class HomeController extends Controller {
        async showHome(ctx: Context) {
            const view = await ctx.view('/app/views/home.html');
            ctx.state.message = 'Welcome to AITS Framework!';
            this.autoBind(view, ctx); // data-bind 속성을 가진 요소를 자동으로 연결
            this.showView(view);
        }
    }
    ```

4.  **`home.html` 뷰 작성:**

    ```html
    <section>
        <h1 data-bind="textContent:message"></h1>
        <p>AI-driven development has begun.</p>
    </section>
    ```

5.  **애플리케이션 실행:**

    ```bash
    npm run dev
    ```

    이제 브라우저에서 환영 메시지를 확인할 수 있습니다.

## 🏛️ 아키텍처 (Architecture)

AITS는 전통적인 MVC 패턴을 현대적으로 재해석하여, 각 컴포넌트의 역할을 명확하게 분리합니다.

```
[사용자 요청: URL 변경]
       |
       V
[1. AITS.ts (라우터)] : URL 감지, Controller 매핑
       |
       V
[2. Controller.ts (두뇌)] : 생명주기 시작 (required -> onLoad -> onEnter)
       |
       +------> [3. Loader.ts] : View, Model 등 리소스 요청 및 캐싱
       |
       V
[4. Model.ts (API 호출)] : Controller의 요청에 따라 API 호출
       |
       V
[5. ApiAdapter.ts (번역)] : Model의 표준 요청을 백엔드 규약에 맞게 변환
       |
       V
[백엔드 API 서버]
       |
       V (데이터 응답)
[6. Model.ts (데이터 반환)]
       |
       V
[7. Controller.ts (로직 처리)] : 받은 데이터를 가공
       |
       V
[8. Context.ts (상태 변경)] : Controller가 Context의 반응형 'state' 업데이트
       |
       V
[9. UI 자동 업데이트] : 'state'와 bind된 View(HTML) 또는 Web Component가 자동으로 갱신됨
```

### 주요 구성 요소

  * **AITS.ts**: 프레임워크의 심장. 라우팅, 컨트롤러 생명주기 관리, API 어댑터 주입 등 모든 것을 총괄합니다.
  * **Controller.ts**: 애플리케이션의 두뇌. `onLoad`, `onEnter`, `onLeave` 등 명확한 생명주기에 따라 비즈니스 로직을 지휘합니다.
  * **Model.ts**: 데이터 전문가. `apiPrefix`를 통해 책임 범위를 명확히 하고, 표준화된 헬퍼 메소드(`getOne`, `getPaged` 등)로 API 통신을 단순화합니다.
  * **ApiAdapter.ts**: 유연한 번역가. 백엔드의 다양한 API 규약(페이지네이션, PK 필드명 등)을 흡수하여 프레임워크의 유연성을 보장합니다.
  * **Context.ts**: 만능 도구 상자. 컨트롤러에게 라우팅 정보, 리소스 로더, 그리고 **반응형 state**를 제공하여 UI 업데이트를 자동화합니다.
  * **Loader.ts**: 효율적인 일꾼. View, Model 등 모든 리소스를 비동기적으로 로드하고, 지능적으로 캐싱하며, 메모리를 자동으로 관리합니다.
  * **Web Components (`<ai-list>` 등)**: AITS의 데이터 흐름과 직접적으로 연동되는 고수준 UI 컴포넌트. 복잡한 UI를 선언적으로 쉽게 구현할 수 있도록 돕습니다.

## ✨ 향후 비전 (Future Vision)

AITS는 단순한 프레임워크를 넘어, AI 기반 개발 생태계의 중심이 되는 것을 목표로 합니다.

  * **AITS-CLI**: 자연어 명령을 해석하여 코드 구조를 자동으로 생성하는 AI 기반 CLI 도구.
  * **AITS-UI-Builder**: 디자이너의 UI 디자인 파일을 분석하여 AITS 웹 컴포넌트 코드로 자동 변환하는 비주얼 빌더.
  * **AITS-Self-Healing**: 코드 실행 중 발생하는 에러를 AI가 스스로 분석하고 코드를 수정하여 해결하는 자가 치유 시스템.

## 🤝 기여하기 (Contributing)

AITS는 이제 막 첫걸음을 뗀 오픈소스 프로젝트입니다. 버그 리포트, 기능 제안, 코드 기여 등 어떤 형태의 참여든 환영합니다. 자세한 내용은 `CONTRIBUTING.md` 파일을 참고해주세요.

## 📜 라이선스 (License)

AITS is MIT licensed.