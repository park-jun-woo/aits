Of course, here is the English version of the README.md file, written in markdown.

-----

# AITS Framework

> The first framework of AI, by AI, for AI.
> "AITS, build my idea."

**AITS (AI-driven TypeScript Stack)** is an innovative SPA (Single Page Application) framework designed primarily for communication with **Development AI Agents**, not just human developers. It aims to maximize web development productivity by providing a structure that is easiest for an AI to understand, generate, and control.

## 🔮 Core Philosophy

Instead of complex freedom, AITS provides a predictable structure and patterns to reduce errors for both AI and developers, enhancing collaboration efficiency.

### 🤖 AI-Friendly Design

AI generates the best code when it follows clear, structured patterns. Every component of AITS is designed for AI to easily learn and produce predictable code.

### 📜 Declarative Programming

Instead of complex code that dictates "how," you simply declare "what" you want using web components like `<ai-list>`, `<ai-form>`, and helper methods.

### 🏛️ Predictable Architecture

All functionalities, such as `Controller`, `Model`, and `ApiAdapter`, follow a defined location and pattern. The AI knows exactly where and how to modify the code when adding new features.

### 🧩 Powerful Abstraction

Complex tasks like API communication, state management, and resource loading are handled internally by the framework. The AI and developers can focus solely on business logic.

## 🚀 Quick Start

AITS automates project creation through the `ai-cli` tool. (The CLI is planned for a future release).

1.  **Create an AITS project:**

    ```bash
    npx ai-cli new my-blog-project
    ```

2.  **Add a route to the `routes.ts` file:**
    Instruct the AI or write it yourself.

    ```typescript
    // /src/app/routes.ts
    export default [
        { path: '/', controllerPath: '/app/controllers/HomeController.js', methodName: 'showHome' }
    ];
    ```

3.  **Create `HomeController.ts`:**

    ```typescript
    // /src/app/controllers/HomeController.ts
    import { Controller, Context } from '../framework';

    export default class HomeController extends Controller {
        async showHome(ctx: Context) {
            const view = await ctx.view('/app/views/home.html');
            ctx.state.message = 'Welcome to AITS Framework!';
            this.autoBind(view, ctx); // Automatically connects elements with the data-bind attribute
            this.showView(view);
        }
    }
    ```

4.  **Create the `home.html` view:**

    ```html
    <section>
        <h1 data-bind="textContent:message"></h1>
        <p>AI-driven development has begun.</p>
    </section>
    ```

5.  **Run the application:**

    ```bash
    npm run dev
    ```

    You can now see the welcome message in your browser.

## 🏛️ Architecture

AITS modernizes the traditional MVC pattern to clearly separate the roles of each component.

```
[User Request: URL Change]
       |
       V
[1. AITS.ts (Router)] : Detects URL, Maps to Controller
       |
       V
[2. Controller.ts (Brain)] : Lifecycle begins (required -> onLoad -> onEnter)
       |
       +------> [3. Loader.ts] : Requests and caches resources like View, Model
       |
       V
[4. Model.ts (API Call)] : Makes API calls based on Controller's request
       |
       V
[5. ApiAdapter.ts (Translator)] : Translates standard Model requests to fit the backend's protocol
       |
       V
[Backend API Server]
       |
       V (Data Response)
[6. Model.ts (Returns Data)]
       |
       V
[7. Controller.ts (Process Logic)] : Processes the received data
       |
       V
[8. Context.ts (State Change)] : Controller updates the reactive 'state' in the Context
       |
       V
[9. UI Auto-Update] : The View (HTML) or Web Component bound to the 'state' is automatically updated
```

### Key Components

  * **AITS.ts**: The heart of the framework. Manages everything including routing, controller lifecycle, and API adapter injection.
  * **Controller.ts**: The application's brain. Directs business logic according to a clear lifecycle (`onLoad`, `onEnter`, `onLeave`).
  * **Model.ts**: The data expert. Clarifies its scope via `apiPrefix` and simplifies API communication with standardized helper methods (`getOne`, `getPaged`).
  * **ApiAdapter.ts**: The flexible translator. Ensures framework flexibility by adapting to various backend API protocols (e.g., pagination, PK field names).
  * **Context.ts**: The universal toolbox. Provides the controller with routing info, a resource loader, and a **reactive state** to automate UI updates.
  * **Loader.ts**: The efficient worker. Asynchronously loads all resources like Views and Models, intelligently caches them, and manages memory automatically.
  * **Web Components (`<ai-list>`, etc.)**: High-level UI components that directly integrate with AITS's data flow, enabling easy, declarative implementation of complex UI.

## ✨ Future Vision

AITS aims to become more than just a framework; it strives to be the center of an AI-driven development ecosystem.

  * **AITS-CLI**: An AI-powered CLI tool that automatically generates code structure by interpreting natural language commands.
  * **AITS-UI-Builder**: A visual builder that analyzes a designer's UI files and automatically converts them into AITS web component code.
  * **AITS-Self-Healing**: A self-healing system where an AI analyzes errors that occur during runtime, and fixes them by modifying the code.

## 🤝 Contributing

AITS is an open-source project that has just taken its first step. We welcome any form of participation, including bug reports, feature suggestions, and code contributions. For more details, please refer to the `CONTRIBUTING.md` file.

## 📜 License

AITS is MIT licensed.