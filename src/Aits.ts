/**
 * =================================================================
 * Aits.ts - Aits 프레임워크의 중앙 관제 센터 (개선된 버전)
 * =================================================================
 * @description
 * - 프레임워크의 전체 생명주기, 라우팅, 컨트롤러 관리를 담당합니다.
 * - 메모리 관리, 에러 처리, 라우터 초기화가 개선되었습니다.
 * @author Aits Framework AI
 * @version 0.3.0
 */

import Navigo from 'navigo';
import { Loader, LoadOptions } from './Loader';
import { Context } from './Context';
import { Controller } from './Controller';
import { Model } from './Model';
import { Renderer, LayoutConfig, TransitionOptions, Transition } from './Renderer';
import { IApiAdapter, DefaultApiAdapter } from './ApiAdapter';

// 라우팅 규칙을 정의하기 위한 타입
export interface RouteDefinition {
    path: string;
    controllerPath: string;
    methodName: string;
}

// 모델 등록 옵션
export interface ModelRegistration {
    instance?: Model;
    path?: string;
    loaded?: boolean;
}

export class Aits {
    private navigator: Navigo;
    private loader: Loader;
    private renderer: Renderer;
    public apiAdapter: IApiAdapter;
    
    // 컨트롤러 관리
    private controllers: Map<string, Promise<Controller>>;
    private activeController: Controller | null;
    
    // 모델 관리 - 통합된 단일 Map으로 관리
    private models: Map<string, ModelRegistration>;
    
    // 프레임워크 상태
    private isRunning: boolean;
    private routeDefinitions: RouteDefinition[];
    private isRouterInitialized: boolean = false;  // 라우터 초기화 상태

    public constructor() {
        // 기본 초기화
        this.loader = new Loader(this);
        this.renderer = new Renderer(this);
        this.apiAdapter = new DefaultApiAdapter();
        
        this.controllers = new Map();
        this.models = new Map();
        this.activeController = null;
        this.isRunning = false;
        this.routeDefinitions = [];

        // Navigator 초기화 (라우트 설정 전)
        this.navigator = new Navigo('/');
        
        // 브라우저 뒤로가기/앞으로가기 처리 (훅만 설정)
        this.navigator.hooks({
            before: (done) => {
                // 라우트 변경 전 처리
                this.beforeRouteChange()
                    .then(() => done())
                    .catch((err) => {
                        console.error('[Aits] Route change cancelled:', err);
                        // 라우트 변경 취소
                    });
            },
            after: () => {
                // 라우트 변경 후 처리
                this.afterRouteChange();
            }
        });
        
        // 글로벌 에러 핸들러 설정
        this.setupGlobalErrorHandler();
    }
    
    /**
     * 라우터 초기화 완료 (모든 라우트 설정 후 호출)
     */
    private initializeRouter(): void {
        if (this.isRouterInitialized) return;
        
        // 404 핸들러 정의 (라우트 설정 후)
        this.navigator.notFound(() => {
            this.handle404();
        });
        
        this.isRouterInitialized = true;
    }
    
    /**
     * 라우트 변경 전 처리
     */
    private async beforeRouteChange(): Promise<void> {
        // 현재 컨트롤러의 canLeave 체크
        if (this.activeController) {
            const controller = this.activeController as any;
            if (typeof controller.canLeave === 'function') {
                const canLeave = await controller.canLeave(new Context(this));
                if (!canLeave) {
                    // 라우트 변경 취소
                    throw new Error('Route change cancelled by canLeave guard');
                }
            }
        }
    }
    
    /**
     * 라우트 변경 후 처리
     */
    private afterRouteChange(): void {
        this.updatePageLinks();
        
        // 스크롤 위치 초기화
        window.scrollTo(0, 0);
        
        // 라우트 변경 이벤트 발생
        document.dispatchEvent(new CustomEvent('aits:route-changed', {
            detail: { route: this.getCurrentRoute() },
            bubbles: true
        }));
    }
    
    /**
     * 글로벌 에러 핸들러 설정
     */
    private setupGlobalErrorHandler(): void {
        window.addEventListener('error', (event) => {
            console.error('[Aits] Global error:', event.error);
            this.handleGlobalError(event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[Aits] Unhandled rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });
    }
    
    /**
     * 글로벌 에러 처리
     */
    private handleGlobalError(error: any): void {
        // 현재 컨트롤러의 onError 호출
        if (this.activeController) {
            const controller = this.activeController as any;
            if (typeof controller.onError === 'function') {
                try {
                    controller.onError(error, new Context(this));
                } catch (e) {
                    console.error('[Aits] Error in controller.onError:', e);
                }
            }
        }
        
        // 사용자에게 에러 표시 (Toast 사용 가능한 경우)
        if (typeof (window as any).AitsToast !== 'undefined') {
            (window as any).AitsToast.error('An error occurred. Please try again.');
        }
    }

    /**
     * 404 에러 처리 (개선된 버전)
     */
    private handle404(): void {
        console.error('[Aits] 404 Not Found: The requested route does not exist.');
        
        // 404 컨트롤러가 정의되어 있는지 확인
        const has404Route = this.routeDefinitions.some(r => r.path === '/404');
        
        if (has404Route) {
            // 404 라우트로 리다이렉트
            this.navigate('/404');
        } else {
            // 기본 404 페이지 렌더링
            this.renderDefault404Page();
        }
    }
    
    /**
     * 기본 404 페이지 렌더링
     */
    private renderDefault404Page(): void {
        const mainContainer = document.querySelector('[data-aits-main]');
        if (mainContainer) {
            mainContainer.innerHTML = `
                <div class="aits-404" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 50vh;
                    text-align: center;
                    padding: 2rem;
                ">
                    <h1 style="font-size: 4rem; margin: 0; color: #e5e7eb;">404</h1>
                    <p style="font-size: 1.25rem; color: #6b7280; margin: 1rem 0;">Page not found</p>
                    <p style="color: #9ca3af; margin-bottom: 2rem;">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                    <a href="/" data-navigo style="
                        display: inline-block;
                        padding: 0.75rem 1.5rem;
                        background: #3b82f6;
                        color: white;
                        text-decoration: none;
                        border-radius: 0.375rem;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#2563eb'"
                       onmouseout="this.style.background='#3b82f6'">
                        Go Home
                    </a>
                </div>
            `;
            this.updatePageLinks();
        }
    }

    /**
     * 프레임워크에서 사용할 API 어댑터를 설정합니다.
     * @param adapter - 사용할 API 어댑터 인스턴스
     */
    public setApiAdapter(adapter: IApiAdapter): void {
        if (this.isRunning) {
            console.warn('[Aits] API adapter should be set before calling run()');
        }
        this.apiAdapter = adapter;
    }

    /**
     * 모델을 등록합니다. (인스턴스 또는 경로)
     * @param name - 모델 식별 이름
     * @param modelOrPath - 모델 인스턴스 또는 파일 경로
     */
    public model(name: string, modelOrPath: Model | string): void {
        const existing = this.models.get(name);
        
        if (existing?.loaded) {
            console.warn(`[Aits] Model '${name}' is already loaded. Skipping registration.`);
            return;
        }
        
        if (typeof modelOrPath === 'string') {
            // 경로로 등록
            this.models.set(name, { path: modelOrPath });
        } else {
            // 인스턴스로 등록
            this.models.set(name, { instance: modelOrPath, loaded: true });
        }
    }

    /**
     * 등록된 모델 인스턴스를 가져옵니다.
     * @param name - 모델 이름
     * @returns 모델 인스턴스
     */
    public async getModel<T extends Model>(name: string): Promise<T> {
        const registration = this.models.get(name);
        
        if (!registration) {
            throw new Error(`[Aits] Model '${name}' is not registered.`);
        }
        
        // 이미 로드된 인스턴스가 있으면 반환
        if (registration.loaded && registration.instance) {
            return registration.instance as T;
        }
        
        // 경로가 있으면 동적 로드
        if (registration.path) {
            try {
                const module = await import(/* @vite-ignore */ registration.path);
                const ModelClass = module.default;
                
                if (typeof ModelClass !== 'function') {
                    throw new Error(`Module at '${registration.path}' does not export a valid Model class.`);
                }
                
                const modelInstance = new ModelClass(this);
                
                // 캐시에 저장
                registration.instance = modelInstance;
                registration.loaded = true;
                
                return modelInstance as T;
            } catch (err) {
                console.error(`[Aits] Failed to load model '${name}' from path '${registration.path}':`, err);
                throw err;
            }
        }
        
        throw new Error(`[Aits] Model '${name}' has no valid instance or path.`);
    }

    /**
     * 모든 등록된 모델을 프리로드합니다.
     */
    public async preloadModels(): Promise<void> {
        const loadPromises: Promise<any>[] = [];
        
        for (const [name, registration] of this.models.entries()) {
            if (!registration.loaded && registration.path) {
                loadPromises.push(this.getModel(name));
            }
        }
        
        if (loadPromises.length > 0) {
            await Promise.all(loadPromises);
            console.log(`[Aits] Preloaded ${loadPromises.length} models`);
        }
    }

    /**
     * 라우팅 설정 파일을 동적으로 불러와 라우팅 규칙을 설정합니다.
     * @param path - 라우팅 설정 파일의 경로
     */
    public async routes(path: string): Promise<void> {
        try {
            const module = await import(/* @vite-ignore */ path);
            const definitions: RouteDefinition[] = module.default;

            if (!Array.isArray(definitions)) {
                throw new Error('Routes file must export an array of RouteDefinition');
            }

            // 기존 라우트 정의 저장
            this.routeDefinitions = definitions;
            
            // 각 라우트 등록
            definitions.forEach(route => {
                this.addRoute(route.path, route.controllerPath, route.methodName);
            });
            
            // 라우터 초기화 완료 (404 핸들러 설정)
            this.initializeRouter();
            
            // 프레임워크가 이미 실행 중이면 현재 URL 재평가
            if (this.isRunning) {
                this.navigator.resolve();
            }
            
            console.log(`[Aits] Loaded ${definitions.length} routes from ${path}`);
        } catch (err) {
            console.error(`[Aits] Error loading routes from ${path}:`, err);
            throw err;
        }
    }

    /**
     * 단일 라우팅 규칙을 추가합니다. (개선된 버전)
     * @param path - URL 경로
     * @param controllerPath - 컨트롤러 파일 경로
     * @param methodName - 실행할 메소드 이름
     */
    public addRoute(path: string, controllerPath: string, methodName: string): void {
        this.navigator.on(path, async (match) => {
            try {
                // 이전 컨트롤러 정리
                await this.cleanupActiveController();

                // 새 컨트롤러 로드
                const controller = await this.getController(controllerPath);
                
                // Context 생성
                const context = new Context(this, match);
                
                // 활성 컨트롤러 설정
                this.activeController = controller;
                
                // canEnter 가드 체크
                const controllerAny = controller as any;
                if (typeof controllerAny.canEnter === 'function') {
                    const canEnter = await controllerAny.canEnter(context);
                    if (!canEnter) {
                        console.log('[Aits] Route entry blocked by canEnter guard');
                        this.activeController = null;
                        return;
                    }
                }

                // 생명주기 실행
                if (typeof controller.onEnter === 'function') {
                    await controller.onEnter(context);
                }
                
                // 라우트 메소드 실행
                const method = controllerAny[methodName];
                if (typeof method === 'function') {
                    await method.call(controller, context);
                } else {
                    throw new Error(`Method '${methodName}' not found in controller`);
                }
            } catch (err) {
                console.error(`[Aits] Error processing route '${path}':`, err);
                
                // 에러 처리
                if (this.activeController) {
                    const controllerAny = this.activeController as any;
                    if (typeof controllerAny.onError === 'function') {
                        try {
                            await controllerAny.onError(err, new Context(this, match));
                        } catch (e) {
                            console.error('[Aits] Error in controller.onError:', e);
                        }
                    }
                }
                
                // 404 페이지로 이동
                this.handle404();
            }
        });
    }

    /**
     * 컨트롤러를 가져옵니다. (캐시 사용)
     * @param controllerPath - 컨트롤러 파일 경로
     */
    private async getController(controllerPath: string): Promise<Controller> {
        // 캐시 확인
        let controllerPromise = this.controllers.get(controllerPath);
        
        if (!controllerPromise) {
            controllerPromise = this.loadController(controllerPath);
            this.controllers.set(controllerPath, controllerPromise);
        }
        
        return controllerPromise;
    }

    /**
     * 컨트롤러를 로드하고 초기화합니다.
     * @param controllerPath - 컨트롤러 파일 경로
     */
    private async loadController(controllerPath: string): Promise<Controller> {
        try {
            const module = await import(/* @vite-ignore */ controllerPath);
            const ControllerClass = module.default;
            
            if (typeof ControllerClass !== 'function') {
                throw new Error('Controller module must export a class as default');
            }
            
            const controller = new ControllerClass(this);
            const context = new Context(this);

            // 생명주기 1: required - 필수 리소스 로드
            if (typeof controller.required === 'function') {
                const resources = controller.required(context);
                if (Array.isArray(resources)) {
                    await Promise.all(resources);
                }
            }

            // 생명주기 2: onLoad - 최초 1회 실행
            if (typeof controller.onLoad === 'function') {
                await controller.onLoad(context);
            }
            
            // 초기화 완료 표시
            controller.setInitialized(true);
            
            return controller;
        } catch (err) {
            console.error(`[Aits] Failed to load controller: ${controllerPath}`, err);
            this.controllers.delete(controllerPath);
            throw err;
        }
    }

    /**
     * 활성 컨트롤러를 정리합니다.
     */
    private async cleanupActiveController(): Promise<void> {
        if (this.activeController) {
            try {
                // cleanup 메서드 호출 (자동 정리 포함)
                await this.activeController.cleanup();
            } catch (err) {
                console.error('[Aits] Error cleaning up controller:', err);
            }
        }
        this.activeController = null;
    }

    /**
     * 프레임워크를 시작합니다. (개선된 버전)
     */
    public run(): void {
        if (this.isRunning) {
            console.warn('[Aits] Framework is already running');
            return;
        }
        
        // 라우터가 초기화되지 않았으면 초기화
        if (!this.isRouterInitialized) {
            this.initializeRouter();
        }
        
        this.isRunning = true;
        this.navigator.resolve();
        document.body.classList.add('aits-ready');
        
        // 페이지 링크 초기화
        this.updatePageLinks();
        
        console.log('[Aits] Framework is running');
        
        // 프레임워크 시작 이벤트
        document.dispatchEvent(new CustomEvent('aits:ready', {
            detail: { aits: this },
            bubbles: true
        }));
    }

    /**
     * 프레임워크를 중지합니다. (개선된 버전)
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) return;
        
        console.log('[Aits] Stopping framework...');
        
        // 활성 컨트롤러 정리
        await this.cleanupActiveController();
        
        // 모든 컨트롤러 캐시 정리
        this.controllers.clear();
        
        // 모든 모델 정리
        this.models.forEach((registration) => {
            if (registration.instance && 'destroy' in registration.instance) {
                try {
                    (registration.instance as any).destroy();
                } catch (err) {
                    console.error('[Aits] Error destroying model:', err);
                }
            }
        });
        this.models.clear();
        
        // 네비게이터 정리
        this.navigator.destroy();
        
        // 로더 정리
        this.loader.destroy();
        
        // 렌더러 정리
        this.renderer.destroy();
        
        this.isRunning = false;
        this.isRouterInitialized = false;
        document.body.classList.remove('aits-ready');
        
        console.log('[Aits] Framework stopped');
        
        // 프레임워크 종료 이벤트
        document.dispatchEvent(new CustomEvent('aits:stopped', {
            detail: { aits: this },
            bubbles: true
        }));
    }

    /**
     * 페이지 내의 data-navigo 링크들을 갱신합니다.
     */
    public updatePageLinks(): void {
        if (this.navigator) {
            this.navigator.updatePageLinks();
        }
    }

    /**
     * 프로그래매틱 페이지 이동
     * @param url - 이동할 URL
     */
    public navigate(url: string): void {
        if (!this.navigator) {
            console.error('[Aits] Navigator not initialized');
            return;
        }
        this.navigator.navigate(url);
    }

    /**
     * 현재 경로 정보를 반환합니다.
     */
    public getCurrentRoute(): string {
        return this.navigator.getCurrentLocation().url;
    }

    /**
     * 뒤로 가기
     */
    public back(): void {
        window.history.back();
    }

    /**
     * 앞으로 가기
     */
    public forward(): void {
        window.history.forward();
    }

    // === Loader 프록시 메서드 ===
    
    public html(src: string, options?: LoadOptions) {
        return this.loader.html(src, options);
    }
    
    public json<T = any>(src: string, options?: LoadOptions) {
        return this.loader.json<T>(src, options);
    }

    public script(src: string, options?: LoadOptions) {
        return this.loader.script(src, options);
    }

    public style(src: string, options?: LoadOptions) {
        return this.loader.style(src, options);
    }

    // === Renderer 프록시 메서드 ===
    
    public render(html: string): HTMLElement {
        return this.renderer.render(html);
    }
    
    public async renderLayout(
        config: LayoutConfig,
        context: Context,
        transition?: Transition,
        options?: TransitionOptions
    ): Promise<void> {
        return this.renderer.renderLayout(config, context, transition, options);
    }
    
    public activateComponentsIn(container: HTMLElement): void {
        this.renderer.activateComponentsIn(container);
    }

    // === Getter 메서드 ===
    
    public get isReady(): boolean {
        return this.isRunning;
    }
    
    public get currentController(): Controller | null {
        return this.activeController;
    }
    
    public getRenderer(): Renderer {
        return this.renderer;
    }
    
    public getLoader(): Loader {
        return this.loader;
    }
    
    /**
     * 현재 등록된 라우트 목록 가져오기
     */
    public getRoutes(): RouteDefinition[] {
        return [...this.routeDefinitions];
    }
    
    /**
     * 특정 경로의 라우트 정의 가져오기
     */
    public getRouteDefinition(path: string): RouteDefinition | undefined {
        return this.routeDefinitions.find(r => r.path === path);
    }
    
    /**
     * 프레임워크 상태 정보 가져오기
     */
    public getStatus(): {
        isRunning: boolean;
        isRouterInitialized: boolean;
        activeRoute: string;
        controllerCount: number;
        modelCount: number;
        routeCount: number;
    } {
        return {
            isRunning: this.isRunning,
            isRouterInitialized: this.isRouterInitialized,
            activeRoute: this.getCurrentRoute(),
            controllerCount: this.controllers.size,
            modelCount: this.models.size,
            routeCount: this.routeDefinitions.length
        };
    }
    
    /**
     * 개발자 도구용 디버그 정보 출력
     */
    public debug(): void {
        console.group('[Aits Framework Debug Info]');
        console.table(this.getStatus());
        console.log('Routes:', this.routeDefinitions);
        console.log('Models:', Array.from(this.models.keys()));
        console.log('Controllers:', Array.from(this.controllers.keys()));
        console.log('Cache Stats:', this.loader.getCacheStats());
        console.groupEnd();
    }
}