/**
 * =================================================================
 * Aits.ts - Aits 프레임워크의 중앙 관제 센터 (완전한 개선 버전)
 * =================================================================
 * @description
 * - Controller 캐싱 메모리 관리 개선
 * - 순환 참조 문제 해결
 * - 에러 처리 강화
 * - TypeScript 타입 오류 수정
 * @author Aits Framework AI
 * @version 0.5.2
 */

import Navigo from 'navigo';
import type { Loader, LoadOptions } from './Loader';
import type { Context } from './Context';
import type { Controller } from './Controller';
import type { Model } from './Model';
import type { Renderer, LayoutConfig, TransitionOptions, Transition } from './Renderer';
import type { IApiAdapter } from './ApiAdapter';
import { DefaultApiAdapter } from './ApiAdapter';
import type { Hydrator, HydrationOptions, HydrationResult } from './Hydrator';

// Controller 캐시 엔트리
interface ControllerCacheEntry {
    promise: Promise<Controller>;
    lastAccessed: number;
    refCount: number;
    initialized: boolean;
}

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

// 프레임워크 실행 옵션
export interface RunOptions {
    autoHydrate?: boolean;
    hydrationOptions?: HydrationOptions;
    controllerCacheSize?: number;  // 컨트롤러 캐시 크기
    controllerCacheTTL?: number;   // 컨트롤러 캐시 TTL (ms)
}

// Error Boundary 유틸리티
class ErrorBoundary {
    static async wrap<T>(
        fn: () => Promise<T>, 
        errorHandler?: (error: Error) => void
    ): Promise<T | null> {
        try {
            return await fn();
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('[Aits Error]', err);
            errorHandler?.(err);
            return null;
        }
    }
}

export class Aits {
    private navigator: Navigo;
    private _loader?: Loader;
    private _renderer?: Renderer;
    private _hydrator?: Hydrator;
    public apiAdapter: IApiAdapter;
    
    // 개선된 컨트롤러 캐시 관리
    private controllerCache: Map<string, ControllerCacheEntry>;
    private readonly MAX_CACHE_SIZE: number;
    private readonly CACHE_TTL: number;
    private cacheCleanupInterval: number | null = null;
    private activeController: Controller | null;
    
    // 모델 관리
    private models: Map<string, ModelRegistration>;
    
    // 프레임워크 상태
    private isRunning: boolean;
    private routeDefinitions: RouteDefinition[];
    private isRouterInitialized: boolean = false;
    
    // Hydration 관련 상태
    private hydrationMode: 'none' | 'auto' | 'manual' | 'partial' = 'none';
    private hydrationResult: HydrationResult | null = null;

    public constructor(options: RunOptions = {}) {
        // 캐시 설정
        this.MAX_CACHE_SIZE = options.controllerCacheSize || 10;
        this.CACHE_TTL = options.controllerCacheTTL || 5 * 60 * 1000; // 5분
        
        // 초기화
        this.apiAdapter = new DefaultApiAdapter();
        this.controllerCache = new Map();
        this.models = new Map();
        this.activeController = null;
        this.isRunning = false;
        this.routeDefinitions = [];

        // Navigator 초기화
        this.navigator = new Navigo('/');
        
        // 라우터 훅 설정
        this.setupNavigatorHooks();
        
        // 글로벌 에러 핸들러 설정
        this.setupGlobalErrorHandler();
        
        // 캐시 정리 인터벌 시작
        this.startCacheCleanup();
    }
    
    // Lazy loading getters for circular dependency prevention
    public get loader(): Loader {
        if (!this._loader) {
            const { Loader } = require('./Loader');
            this._loader = new Loader(this);
        }
        return this._loader!;
    }
    
    public get renderer(): Renderer {
        if (!this._renderer) {
            const { Renderer } = require('./Renderer');
            this._renderer = new Renderer(this);
        }
        return this._renderer!;
    }
    
    public get hydrator(): Hydrator {
        if (!this._hydrator) {
            const { Hydrator } = require('./Hydrator');
            this._hydrator = new Hydrator(this);
        }
        return this._hydrator!;
    }
    
    /**
     * 라우터 훅 설정
     */
    private setupNavigatorHooks(): void {
        this.navigator.hooks({
            before: async (done) => {
                const canProceed = await ErrorBoundary.wrap(
                    () => this.beforeRouteChange(),
                    () => done()
                );
                
                if (canProceed !== false) {
                    done();
                }
            },
            after: () => {
                this.afterRouteChange();
            }
        });
    }
    
    /**
     * 컨트롤러 캐시 정리 시작
     */
    private startCacheCleanup(): void {
        this.cacheCleanupInterval = window.setInterval(() => {
            this.cleanupControllerCache();
        }, 60 * 1000); // 1분마다
    }
    
    /**
     * 컨트롤러 캐시 정리 (LRU + TTL)
     */
    private cleanupControllerCache(): void {
        const now = Date.now();
        const entriesToDelete: string[] = [];
        
        // TTL 체크
        this.controllerCache.forEach((entry, path) => {
            if (now - entry.lastAccessed > this.CACHE_TTL && entry.refCount === 0) {
                entriesToDelete.push(path);
            }
        });
        
        // 캐시 크기 체크 (LRU)
        if (this.controllerCache.size > this.MAX_CACHE_SIZE) {
            const sortedEntries = Array.from(this.controllerCache.entries())
                .filter(([, entry]) => entry.refCount === 0)
                .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
            
            const toRemove = sortedEntries.slice(0, sortedEntries.length - this.MAX_CACHE_SIZE);
            toRemove.forEach(([path]) => entriesToDelete.push(path));
        }
        
        // 삭제 실행
        for (const path of entriesToDelete) {
            const entry = this.controllerCache.get(path);
            if (entry) {
                entry.promise.then(controller => {
                    if ('cleanup' in controller) {
                        (controller as any).cleanup();
                    }
                }).catch(() => {});
                this.controllerCache.delete(path);
            }
        }
        
        if (entriesToDelete.length > 0) {
            console.log(`[Aits] Cleaned up ${entriesToDelete.length} cached controllers`);
        }
    }
    
    /**
     * 개선된 컨트롤러 가져오기
     */
    private async getController(controllerPath: string): Promise<Controller> {
        let entry = this.controllerCache.get(controllerPath);
        
        if (entry) {
            entry.lastAccessed = Date.now();
            entry.refCount++;
            
            try {
                const controller = await entry.promise;
                return controller;
            } finally {
                entry.refCount--;
            }
        }
        
        // 새로운 컨트롤러 로드
        const promise = this.loadController(controllerPath);
        entry = {
            promise,
            lastAccessed: Date.now(),
            refCount: 1,
            initialized: false
        };
        
        this.controllerCache.set(controllerPath, entry);
        
        try {
            const controller = await promise;
            entry.initialized = true;
            return controller;
        } catch (error) {
            // 실패한 엔트리 제거
            this.controllerCache.delete(controllerPath);
            throw error;
        } finally {
            entry.refCount--;
        }
    }
    
    /**
     * 컨트롤러 로드
     */
    private async loadController(controllerPath: string): Promise<Controller> {
        const result = await ErrorBoundary.wrap(async () => {
            const module = await import(/* @vite-ignore */ controllerPath);
            const ControllerClass = module.default;
            
            if (typeof ControllerClass !== 'function') {
                throw new Error('Controller module must export a class as default');
            }
            
            const controller = new ControllerClass(this);
            const { Context } = await import('./Context');
            const context = new Context(this);

            // 생명주기 실행
            if (typeof controller.required === 'function') {
                const resources = controller.required(context);
                if (Array.isArray(resources)) {
                    await Promise.all(resources);
                }
            }

            if (typeof controller.onLoad === 'function') {
                await controller.onLoad(context);
            }
            
            controller.setInitialized(true);
            return controller;
        });
        
        if (!result) {
            throw new Error(`Failed to load controller: ${controllerPath}`);
        }
        
        return result;
    }
    
    /**
     * 라우터 초기화 완료
     */
    private initializeRouter(): void {
        if (this.isRouterInitialized) return;
        
        this.navigator.notFound(() => {
            this.handle404();
        });
        
        this.isRouterInitialized = true;
    }
    
    /**
     * 라우트 변경 전 처리
     */
    private async beforeRouteChange(): Promise<boolean> {
        if (this.activeController) {
            const controller = this.activeController as any;
            if (typeof controller.canLeave === 'function') {
                const { Context } = await import('./Context');
                const canLeave = await controller.canLeave(new Context(this));
                if (!canLeave) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * 라우트 변경 후 처리
     */
    private afterRouteChange(): void {
        this.updatePageLinks();
        window.scrollTo(0, 0);
        
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
    private async handleGlobalError(error: any): Promise<void> {
        if (this.activeController) {
            await ErrorBoundary.wrap(async () => {
                const controller = this.activeController as any;
                if (typeof controller.onError === 'function') {
                    const { Context } = await import('./Context');
                    await controller.onError(error, new Context(this));
                }
            });
        }
        
        if (typeof (window as any).AitsToast !== 'undefined') {
            (window as any).AitsToast.error('An error occurred. Please try again.');
        }
    }

    /**
     * 404 에러 처리
     */
    private handle404(): void {
        console.error('[Aits] 404 Not Found: The requested route does not exist.');
        
        const has404Route = this.routeDefinitions.some(r => r.path === '/404');
        
        if (has404Route) {
            this.navigate('/404');
        } else {
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

    // === Hydration 메서드 ===
    
    /**
     * SSR HTML을 SPA로 Hydration
     * @param options - Hydration 옵션
     */
    public async hydrate(options: HydrationOptions = {}): Promise<HydrationResult> {
        if (this.isRunning) {
            console.warn('[Aits] Framework is already running');
            return this.hydrationResult || {
                success: false,
                mode: 'spa',
                components: 0,
                duration: 0,
                errors: [new Error('Framework already running')]
            };
        }
        
        this.hydrationMode = options.mode || 'auto';
        
        // Hydration 실행
        this.hydrationResult = await this.hydrator.hydrate(options);
        
        if (this.hydrationResult.success) {
            this.isRunning = true;
            document.body.classList.add('aits-ready', 'aits-hydrated');
            
            // 라우터 초기화 (이미 존재하는 DOM 기준)
            if (!this.isRouterInitialized) {
                this.initializeRouter();
            }
            
            // 현재 라우트 해결
            this.navigator.resolve();
            
            console.log('[Aits] Hydration successful');
            
            // Hydration 성공 이벤트
            document.dispatchEvent(new CustomEvent('aits:hydration-complete', {
                detail: this.hydrationResult,
                bubbles: true
            }));
        }
        
        return this.hydrationResult;
    }
    
    /**
     * 자동 Hydration 시도
     */
    public async tryHydrate(): Promise<boolean> {
        // DOM에 AITS 컴포넌트가 있는지 확인
        const hasAitsComponents = document.querySelector('[is^="aits-"]') !== null;
        const hasAitsLayout = document.querySelector('[data-aits-main]') !== null;
        
        if (hasAitsComponents || hasAitsLayout) {
            const result = await this.hydrate({ mode: 'auto' });
            return result.success;
        }
        
        return false;
    }
    
    /**
     * Hydration 상태 확인
     */
    public isHydrated(): boolean {
        return this.hydrator.getHydrationState();
    }
    
    /**
     * Hydration 결과 가져오기
     */
    public getHydrationResult(): HydrationResult | null {
        return this.hydrationResult;
    }
    
    /**
     * 특정 요소만 Hydration
     */
    public async hydrateElement(element: HTMLElement): Promise<void> {
        return this.hydrator.hydrateElement(element);
    }
    
    /**
     * 라우트 패턴 추가 (Hydration용)
     */
    public addRoutePattern(pattern: RegExp, controller: string): void {
        this.hydrator.addRoutePattern(pattern, controller);
    }

    // === API 어댑터 관리 ===

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

    // === 모델 관리 ===

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
            const result = await ErrorBoundary.wrap(async () => {
                const module = await import(/* @vite-ignore */ registration.path!);
                const ModelClass = module.default;
                
                if (typeof ModelClass !== 'function') {
                    throw new Error(`Module at '${registration.path}' does not export a valid Model class.`);
                }
                
                const modelInstance = new ModelClass(this);
                
                // 캐시에 저장
                registration.instance = modelInstance;
                registration.loaded = true;
                
                return modelInstance as T;
            });
            
            if (!result) {
                throw new Error(`Failed to load model '${name}'`);
            }
            
            return result;
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

    // === 라우팅 관리 ===

    /**
     * 라우팅 설정 파일을 동적으로 불러와 라우팅 규칙을 설정합니다.
     * @param path - 라우팅 설정 파일의 경로
     */
    public async routes(path: string): Promise<void> {
        const result = await ErrorBoundary.wrap(async () => {
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
        });
        
        if (!result) {
            throw new Error(`Failed to load routes from ${path}`);
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
            await ErrorBoundary.wrap(async () => {
                // 이전 컨트롤러 정리
                await this.cleanupActiveController();

                // 새 컨트롤러 로드
                const controller = await this.getController(controllerPath);
                
                // Context 생성
                const { Context } = await import('./Context');
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
            }, (error) => {
                console.error(`[Aits] Error processing route '${path}':`, error);
                this.handle404();
            });
        });
    }

    /**
     * 활성 컨트롤러를 정리합니다.
     */
    private async cleanupActiveController(): Promise<void> {
        if (this.activeController) {
            await ErrorBoundary.wrap(async () => {
                await this.activeController!.cleanup();
            });
        }
        this.activeController = null;
    }

    // === 프레임워크 실행 ===

    /**
     * 프레임워크를 시작합니다. (Hydration 옵션 추가)
     */
    public async run(options?: RunOptions): Promise<void> {
        if (this.isRunning) {
            console.warn('[Aits] Framework is already running');
            return;
        }
        
        // Auto-hydrate 옵션 확인
        if (options?.autoHydrate) {
            const hydrated = await this.tryHydrate();
            if (hydrated) {
                return; // Hydration 성공 시 일반 run 건너뛰기
            }
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
     * 프레임워크를 중지합니다.
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) return;
        
        console.log('[Aits] Stopping framework...');
        
        // 활성 컨트롤러 정리
        await this.cleanupActiveController();
        
        // 모든 컨트롤러 캐시 정리
        for (const entry of this.controllerCache.values()) {
            await ErrorBoundary.wrap(async () => {
                const controller = await entry.promise;
                if ('cleanup' in controller) {
                    await (controller as any).cleanup();
                }
            });
        }
        this.controllerCache.clear();
        
        // 캐시 정리 인터벌 중지
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
            this.cacheCleanupInterval = null;
        }
        
        // 모든 모델 정리
        for (const registration of this.models.values()) {
            if (registration.instance && 'destroy' in registration.instance) {
                await ErrorBoundary.wrap(async () => {
                    await (registration.instance as any).destroy();
                });
            }
        }
        this.models.clear();
        
        // 네비게이터 정리
        this.navigator.destroy();
        
        // 로더 정리
        if (this._loader) {
            this._loader.destroy();
            this._loader = undefined;
        }
        
        // 렌더러 정리
        if (this._renderer) {
            this._renderer.destroy();
            this._renderer = undefined;
        }
        
        // Hydrator 정리
        if (this._hydrator) {
            this._hydrator.destroy();
            this._hydrator = undefined;
        }
        
        this.isRunning = false;
        this.isRouterInitialized = false;
        this.hydrationMode = 'none';
        this.hydrationResult = null;
        document.body.classList.remove('aits-ready', 'aits-hydrated');
        
        console.log('[Aits] Framework stopped');
        
        // 프레임워크 종료 이벤트
        document.dispatchEvent(new CustomEvent('aits:stopped', {
            detail: { aits: this },
            bubbles: true
        }));
    }

    // === 네비게이션 ===

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
        isHydrated: boolean;
        hydrationMode: string;
        activeRoute: string;
        controllerCount: number;
        modelCount: number;
        routeCount: number;
    } {
        return {
            isRunning: this.isRunning,
            isRouterInitialized: this.isRouterInitialized,
            isHydrated: this.isHydrated(),
            hydrationMode: this.hydrationMode,
            activeRoute: this.getCurrentRoute(),
            controllerCount: this.controllerCache.size,
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
        console.log('Controllers:', Array.from(this.controllerCache.keys()));
        console.log('Cache Stats:', this.loader.getCacheStats());
        
        if (this.hydrationResult) {
            console.log('Hydration Result:', this.hydrationResult);
        }
        
        console.groupEnd();
    }
    
    /**
     * 파괴자
     */
    public destroy(): void {
        this.stop();
    }
}