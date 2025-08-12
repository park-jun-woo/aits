/**
 * =================================================================
 * Controller.ts - Aits 애플리케이션 로직의 기반
 * =================================================================
 * @description
 * - 모든 컨트롤러 클래스가 상속받아야 하는 추상 클래스입니다.
 * - 명확한 생명주기(required → onLoad → onEnter → onLeave)를 제공합니다.
 * - 비즈니스 로직, 데이터 처리, 뷰 제어 등 페이지의 모든 동작을 담당합니다.
 * 
 * @lifecycle
 * 1. required: 필요한 리소스 선언 (최초 1회)
 * 2. onLoad: 리소스 로드 완료 후 초기화 (최초 1회)
 * 3. onEnter: 페이지 진입 시 실행 (매번)
 * 4. [라우트 메서드 실행]
 * 5. onLeave: 페이지 이탈 시 정리 (매번)
 * 
 * @author Aits Framework AI
 * @version 0.3.0
 */

import type { Aits } from './Aits';
import type { Context } from './Context';
import type { Model } from './Model';
import type { LayoutConfig, TransitionOptions, Transition } from './Renderer';

// 미들웨어 타입
export type MiddlewareNext = () => Promise<void> | void;
export type Middleware = (ctx: Context, next: MiddlewareNext) => Promise<void> | void;

// 가드 타입
export type RouteGuard = (ctx: Context) => Promise<boolean> | boolean;

// 이벤트 리스너 정보
interface EventListenerInfo {
    element: Element | Window | Document;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
}

export abstract class Controller {
    protected aits: Aits;
    
    // 초기화 상태 추적
    private initialized: boolean = false;
    
    // 이벤트 리스너 자동 관리
    private eventListeners: EventListenerInfo[] = [];
    
    // 타이머 자동 관리
    private timers: Set<number> = new Set();
    
    // 구독 해제 함수들
    private unsubscribers: Array<() => void> = [];
    
    // 미들웨어 스택
    private middlewares: Middleware[] = [];
    
    // 캐시된 모델 인스턴스
    private modelCache: Map<string, Model> = new Map();

    constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
    }

    /**
     * (생명주기 1) 필수 리소스를 사전 선언합니다.
     * 컨트롤러가 처음 로드될 때 한 번만 실행됩니다.
     * 여기서는 리소스를 "선언"만 하고, 실제 사용은 onLoad에서 합니다.
     * @param ctx - 초기 컨텍스트 객체
     * @returns 로딩할 리소스의 Promise 배열
     * @example
     * required(ctx) {
     *   return [
     *     ctx.html('/views/template.html'),
     *     ctx.json('/api/config'),
     *     ctx.script('/libs/chart.js')
     *   ];
     * }
     */
    public required?(ctx: Context): Promise<any>[];

    /**
     * (생명주기 2) 리소스 로드 완료 후 초기화를 수행합니다.
     * required에서 선언한 모든 리소스가 로드된 후 한 번만 실행됩니다.
     * 외부 라이브러리 초기화, 설정 적용, 전역 이벤트 설정 등을 수행합니다.
     * @param ctx - 초기 컨텍스트 객체
     * @example
     * async onLoad(ctx) {
     *   // 로드된 설정 파일 적용
     *   const config = await ctx.json('/api/config');
     *   this.initializeWithConfig(config);
     *   
     *   // 외부 라이브러리 초기화 (Chart.js가 이미 로드됨)
     *   this.charts = new Chart(...);
     *   
     *   // 전역 이벤트 리스너 설정
     *   this.addEventListener(window, 'resize', this.handleResize);
     * }
     */
    public onLoad?(ctx: Context): Promise<void> | void;

    /**
     * (생명주기 3) 페이지 진입 시마다 실행됩니다.
     * 라우트 가드 체크 후, 라우팅 메소드 실행 전에 호출됩니다.
     * 최신 데이터 로드, 상태 갱신, 권한 체크 등을 수행합니다.
     * @param ctx - 현재 라우트 정보가 포함된 컨텍스트 객체
     * @example
     * async onEnter(ctx) {
     *   // 권한 체크
     *   if (!ctx.state.isAuthenticated) {
     *     return ctx.navigate('/login');
     *   }
     *   
     *   // 최신 데이터 로드
     *   const data = await this.getModel('User').getCurrent();
     *   ctx.state.userData = data;
     * }
     */
    public onEnter?(ctx: Context): Promise<void> | void;

    /**
     * (생명주기 4) 페이지를 떠날 때 호출됩니다.
     * 자동으로 이벤트 리스너, 타이머, 구독 등을 정리합니다.
     * 추가적인 정리 작업이 필요한 경우 오버라이드합니다.
     * @example
     * onLeave() {
     *   // WebSocket 연결 종료
     *   this.websocket?.close();
     *   
     *   // 애니메이션 중지
     *   cancelAnimationFrame(this.animationId);
     * }
     */
    public onLeave?(): Promise<void> | void;

    /**
     * 에러 발생 시 호출되는 핸들러
     * @param error - 발생한 에러
     * @param ctx - 컨텍스트 객체
     */
    public onError?(error: Error, ctx: Context): Promise<void> | void;

    // === 라우트 가드 ===

    /**
     * 라우트 진입을 허용할지 결정하는 가드
     * false 반환 시 라우트 진입이 차단됩니다.
     */
    protected canEnter?(ctx: Context): Promise<boolean> | boolean;

    /**
     * 라우트 이탈을 허용할지 결정하는 가드
     * false 반환 시 라우트 이탈이 차단됩니다.
     */
    protected canLeave?(ctx: Context): Promise<boolean> | boolean;

    // === 헬퍼 메서드 ===

    /**
     * 모델 인스턴스를 가져옵니다 (캐싱 지원)
     */
    protected async getModel<T extends Model>(name: string): Promise<T> {
        if (!this.modelCache.has(name)) {
            const model = await this.aits.getModel<T>(name);
            this.modelCache.set(name, model);
        }
        return this.modelCache.get(name) as T;
    }

    /**
     * 레이아웃을 렌더링합니다.
     */
    protected async renderLayout(
        config: LayoutConfig,
        ctx: Context,
        transition?: Transition,
        options?: TransitionOptions
    ): Promise<void> {
        return this.aits.renderLayout(config, ctx, transition, options);
    }

    /**
     * 뷰를 렌더링하고 컨텍스트 상태와 바인딩합니다.
     */
    protected async renderView(
        viewPath: string,
        ctx: Context,
        targetSelector: string = '[data-aits-main]'
    ): Promise<void> {
        const html = await ctx.html(viewPath);
        const element = this.aits.render(html);
        
        const target = document.querySelector(targetSelector);
        if (target) {
            target.innerHTML = '';
            target.appendChild(element);
            
            // 컴포넌트 활성화
            this.aits.activateComponentsIn(element);
            
            // 자동 바인딩
            this.autoBindView(element, ctx);
        }
    }

    /**
     * data-bind 속성을 가진 요소들을 자동으로 바인딩합니다.
     */
    protected autoBindView(container: HTMLElement, ctx: Context): void {
        const elements = container.querySelectorAll('[data-bind]');
        
        elements.forEach(element => {
            const bindConfig = element.getAttribute('data-bind');
            if (!bindConfig) return;
            
            // "property:stateKey" 형식 파싱
            const [property, stateKey] = bindConfig.split(':').map(s => s.trim());
            
            if (property && stateKey) {
                ctx.bind(stateKey, element as HTMLElement, property);
            }
        });
    }

    /**
     * 이벤트 리스너를 추가합니다. (자동 정리 지원)
     */
    protected addEventListener(
        element: Element | Window | Document | string,
        event: string,
        handler: EventListener,
        options?: boolean | AddEventListenerOptions
    ): void {
        const target = typeof element === 'string' 
            ? document.querySelector(element) 
            : element;
            
        if (!target) return;
        
        target.addEventListener(event, handler, options);
        
        this.eventListeners.push({
            element: target,
            event,
            handler,
            options
        });
    }

    /**
     * 이벤트 위임을 설정합니다.
     */
    protected delegate(
        parentSelector: string,
        eventType: string,
        childSelector: string,
        handler: (event: Event, target: Element) => void
    ): void {
        const parent = document.querySelector(parentSelector);
        if (!parent) return;
        
        const delegatedHandler = (event: Event) => {
            const target = (event.target as Element).closest(childSelector);
            if (target && parent.contains(target)) {
                handler(event, target);
            }
        };
        
        this.addEventListener(parent, eventType, delegatedHandler);
    }

    /**
     * 타이머를 설정합니다. (자동 정리 지원)
     */
    protected setTimeout(callback: () => void, delay: number): number {
        const timerId = window.setTimeout(() => {
            callback();
            this.timers.delete(timerId);
        }, delay);
        
        this.timers.add(timerId);
        return timerId;
    }

    /**
     * 인터벌을 설정합니다. (자동 정리 지원)
     */
    protected setInterval(callback: () => void, interval: number): number {
        const timerId = window.setInterval(callback, interval);
        this.timers.add(timerId);
        return timerId;
    }

    /**
     * 구독 해제 함수를 등록합니다.
     */
    protected addUnsubscriber(unsubscribe: () => void): void {
        this.unsubscribers.push(unsubscribe);
    }

    /**
     * 미들웨어를 추가합니다.
     */
    protected use(middleware: Middleware): void {
        this.middlewares.push(middleware);
    }

    /**
     * 미들웨어를 실행합니다.
     */
    protected async runMiddlewares(ctx: Context): Promise<void> {
        let index = 0;
        
        const next: MiddlewareNext = async () => {
            if (index < this.middlewares.length) {
                const middleware = this.middlewares[index++];
                await middleware(ctx, next);
            }
        };
        
        await next();
    }

    /**
     * 로딩 상태를 표시합니다.
     */
    protected showLoading(message: string = 'Loading...'): void {
        // 기본 로딩 UI 구현
        const loader = document.createElement('div');
        loader.id = 'aits-loader';
        loader.className = 'aits-loading';
        loader.innerHTML = `
            <div class="aits-loading-spinner"></div>
            <div class="aits-loading-message">${message}</div>
        `;
        document.body.appendChild(loader);
    }

    /**
     * 로딩 상태를 숨깁니다.
     */
    protected hideLoading(): void {
        const loader = document.getElementById('aits-loader');
        loader?.remove();
    }

    /**
     * 에러를 표시합니다.
     */
    protected showError(message: string, duration: number = 5000): void {
        const errorElement = document.createElement('div');
        errorElement.className = 'aits-error-toast';
        errorElement.textContent = message;
        document.body.appendChild(errorElement);
        
        this.setTimeout(() => errorElement.remove(), duration);
    }

    /**
     * 성공 메시지를 표시합니다.
     */
    protected showSuccess(message: string, duration: number = 3000): void {
        const successElement = document.createElement('div');
        successElement.className = 'aits-success-toast';
        successElement.textContent = message;
        document.body.appendChild(successElement);
        
        this.setTimeout(() => successElement.remove(), duration);
    }

    /**
     * 확인 다이얼로그를 표시합니다.
     */
    protected async confirm(message: string, title?: string): Promise<boolean> {
        // 커스텀 확인 다이얼로그 구현 가능
        // 기본적으로는 브라우저 confirm 사용
        return window.confirm(message);
    }

    /**
     * 디바운스된 함수를 생성합니다.
     */
    protected debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeoutId: number | undefined;
        
        return (...args: Parameters<T>) => {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
                this.timers.delete(timeoutId);
            }
            
            timeoutId = this.setTimeout(() => func(...args), wait);
        };
    }

    /**
     * 쓰로틀된 함수를 생성합니다.
     */
    protected throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean = false;
        
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                this.setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // === 내부 정리 메서드 ===

    /**
     * 컨트롤러 정리 (프레임워크가 자동 호출)
     */
    public async cleanup(): Promise<void> {
        // 사용자 정의 onLeave 실행
        if (this.onLeave) {
            await this.onLeave();
        }
        
        // 이벤트 리스너 제거
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventListeners = [];
        
        // 타이머 정리
        this.timers.forEach(timerId => {
            clearTimeout(timerId);
            clearInterval(timerId);
        });
        this.timers.clear();
        
        // 구독 해제
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
        
        // 모델 캐시 정리
        this.modelCache.clear();
    }

    /**
     * 초기화 완료 여부 확인
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 초기화 완료 설정
     */
    public setInitialized(value: boolean): void {
        this.initialized = value;
    }
}