/**
 * =================================================================
 * Aits.ts - Aits 프레임워크의 중앙 관제 센터
 * =================================================================
 * @description
 * - 프레임워크의 전체 생명주기, 라우팅, 컨트롤러 관리를 담당합니다.
 * - AI가 애플리케이션의 구조를 쉽게 파악하고 제어할 수 있도록,
 * 명확하고 예측 가능한 패턴을 제공하는 것을 목표로 합니다.
 * @author Aits Framework AI
 * @version 0.2.0
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

    public constructor() {
        this.navigator = new Navigo('/');
        this.loader = new Loader(this);
        this.renderer = new Renderer(this);
        this.apiAdapter = new DefaultApiAdapter();
        
        this.controllers = new Map();
        this.models = new Map();
        this.activeController = null;
        this.isRunning = false;
        this.routeDefinitions = [];

        // 404 핸들러 정의
        this.navigator.notFound(() => {
            this.handle404();
        });
        
        // 브라우저 뒤로가기/앞으로가기 처리
        this.navigator.hooks({
            before: (done) => {
                // 라우트 변경 전 처리
                done();
            },
            after: () => {
                // 라우트 변경 후 처리
                this.updatePageLinks();
            }
        });
    }

    /**
     * 404 에러 처리
     */
    private handle404(): void {
        console.error('[Aits] 404 Not Found: The requested route does not exist.');
        
        // 404 페이지 렌더링 시도
        if (this.routeDefinitions.some(r => r.path === '/404')) {
            this.navigate('/404');
        } else {
            // 기본 404 메시지 표시
            const mainContainer = document.querySelector('[data-aits-main]');
            if (mainContainer) {
                mainContainer.innerHTML = `
                    <div class="aits-404">
                        <h1>404</h1>
                        <p>Page not found</p>
                        <a href="/" data-navigo>Go Home</a>
                    </div>
                `;
                this.updatePageLinks();
            }
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
     * 단일 라우팅 규칙을 추가합니다.
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

                // 생명주기 실행
                if (typeof controller.onEnter === 'function') {
                    await controller.onEnter(context);
                }
                
                // 라우트 메소드 실행
                const method = (controller as any)[methodName];
                if (typeof method === 'function') {
                    await method.call(controller, context);
                } else {
                    throw new Error(`Method '${methodName}' not found in controller`);
                }
            } catch (err) {
                console.error(`[Aits] Error processing route '${path}':`, err);
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
        if (this.activeController && typeof this.activeController.onLeave === 'function') {
            try {
                await this.activeController.onLeave();
            } catch (err) {
                console.error('[Aits] Error in controller.onLeave():', err);
            }
        }
        this.activeController = null;
    }

    /**
     * 프레임워크를 시작합니다.
     */
    public run(): void {
        if (this.isRunning) {
            console.warn('[Aits] Framework is already running');
            return;
        }
        
        this.isRunning = true;
        this.navigator.resolve();
        document.body.classList.add('aits-ready');
        
        // 페이지 링크 초기화
        this.updatePageLinks();
        
        console.log('[Aits] Framework is running');
    }

    /**
     * 프레임워크를 중지합니다.
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) return;
        
        // 활성 컨트롤러 정리
        await this.cleanupActiveController();
        
        // 네비게이터 정리
        this.navigator.destroy();
        
        // 로더 정리
        this.loader.destroy();
        
        // 렌더러 정리
        this.renderer.clearLayout();
        
        this.isRunning = false;
        document.body.classList.remove('aits-ready');
        
        console.log('[Aits] Framework stopped');
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
}