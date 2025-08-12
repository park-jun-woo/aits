/**
 * =================================================================
 * Hydrator.ts - SSR to SPA Hydration Manager
 * =================================================================
 * @description
 * - SSR로 렌더링된 HTML을 분석하여 SPA로 전환합니다.
 * - 부가 정보 없이 DOM 구조만으로 컴포넌트와 상태를 추론합니다.
 * - 점진적 향상(Progressive Enhancement)을 지원합니다.
 * @author Aits Framework AI
 * @version 1.0.0
 */

import type { Aits } from './Aits';
import type { Context } from './Context';
import type { Controller } from './Controller';
import type { AitsElement } from './components';
import { COMPONENT_REGISTRY, ComponentUtils } from './components';

// Hydration 옵션
export interface HydrationOptions {
    mode?: 'auto' | 'manual' | 'partial';  // Hydration 모드
    strategy?: 'immediate' | 'idle' | 'visible' | 'interactive';  // 실행 전략
    priority?: string[];  // 우선순위 컴포넌트 타입
    fallback?: 'spa' | 'static' | 'none';  // 실패 시 폴백
    preserveState?: boolean;  // 기존 폼 상태 등 보존
}

// Hydration 결과
export interface HydrationResult {
    success: boolean;
    mode: 'hydrated' | 'spa' | 'static';
    components: number;
    duration: number;
    errors: Error[];
}

// 컴포넌트 분석 결과
interface ComponentAnalysis {
    element: HTMLElement;
    type: string;
    data: any;
    state: any;
    priority: number;
}

// 라우트 분석 결과
interface RouteAnalysis {
    path: string;
    controller?: string;
    params: Record<string, string>;
    query: Record<string, string>;
}

// 레이아웃 분석 결과
interface LayoutAnalysis {
    hasHeader: boolean;
    hasFooter: boolean;
    hasSidebar: boolean;
    mainContent: HTMLElement | null;
}

export class Hydrator {
    private aits: Aits;
    private isHydrated: boolean = false;
    private hydrationResult: HydrationResult | null = null;
    private componentMap: Map<HTMLElement, AitsElement> = new Map();
    private observers: Map<HTMLElement, IntersectionObserver> = new Map();
    private startTime: number = 0;
    
    // 라우트 패턴 매핑 (확장 가능)
    private routePatterns: Map<RegExp, string> = new Map([
        [/^\/articles?$/, 'ArticleListController'],
        [/^\/articles?\/(\d+)$/, 'ArticleDetailController'],
        [/^\/users?\/(\w+)$/, 'UserProfileController'],
        [/^\/search$/, 'SearchController'],
        [/^\/$/, 'HomeController']
    ]);
    
    constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
    }
    
    /**
     * Hydration 시작
     */
    public async hydrate(options: HydrationOptions = {}): Promise<HydrationResult> {
        if (this.isHydrated) {
            console.warn('[Hydrator] Already hydrated');
            return this.hydrationResult!;
        }
        
        this.startTime = performance.now();
        const errors: Error[] = [];
        let componentCount = 0;
        
        try {
            console.log('[Hydrator] Starting hydration...');
            
            // 1. DOM 분석
            const analysis = this.analyzeDom();
            
            // 2. Hydration 가능 여부 판단
            if (!this.canHydrate(analysis)) {
                console.log('[Hydrator] Cannot hydrate, falling back to SPA mode');
                return this.fallbackToSpa(options);
            }
            
            // 3. 라우트 설정
            await this.setupRoute(analysis.route);
            
            // 4. 컴포넌트 Hydration
            componentCount = await this.hydrateComponents(
                analysis.components, 
                options
            );
            
            // 5. 이벤트 바인딩
            this.bindGlobalEvents();
            
            // 6. 라우터 동기화
            this.syncRouter();
            
            this.isHydrated = true;
            
            const duration = performance.now() - this.startTime;
            console.log(`[Hydrator] Hydration completed in ${duration.toFixed(2)}ms`);
            
            this.hydrationResult = {
                success: true,
                mode: 'hydrated',
                components: componentCount,
                duration,
                errors
            };
            
        } catch (error) {
            console.error('[Hydrator] Hydration failed:', error);
            errors.push(error as Error);
            
            // 폴백 처리
            if (options.fallback === 'spa') {
                return this.fallbackToSpa(options);
            }
            
            this.hydrationResult = {
                success: false,
                mode: 'static',
                components: componentCount,
                duration: performance.now() - this.startTime,
                errors
            };
        }
        
        // Hydration 완료 이벤트
        this.emitHydrationComplete(this.hydrationResult);
        
        return this.hydrationResult;
    }
    
    /**
     * DOM 구조 분석
     */
    private analyzeDom(): {
        components: ComponentAnalysis[];
        layout: LayoutAnalysis;
        route: RouteAnalysis;
    } {
        console.log('[Hydrator] Analyzing DOM structure...');
        
        return {
            components: this.findComponents(),
            layout: this.analyzeLayout(),
            route: this.analyzeRoute()
        };
    }
    
    /**
     * AITS 컴포넌트 찾기
     */
    private findComponents(): ComponentAnalysis[] {
        const components: ComponentAnalysis[] = [];
        
        // is 속성을 가진 모든 요소 찾기
        const elements = document.querySelectorAll('[is^="aits-"]');
        
        elements.forEach((element, index) => {
            const htmlElement = element as HTMLElement;
            const type = htmlElement.getAttribute('is')!;
            
            components.push({
                element: htmlElement,
                type,
                data: this.extractDataFromElement(htmlElement, type),
                state: this.extractStateFromElement(htmlElement, type),
                priority: this.calculatePriority(htmlElement, type, index)
            });
        });
        
        // 우선순위 정렬
        components.sort((a, b) => b.priority - a.priority);
        
        console.log(`[Hydrator] Found ${components.length} components`);
        return components;
    }
    
    /**
     * 요소에서 데이터 추출
     */
    private extractDataFromElement(element: HTMLElement, type: string): any {
        const data: any = {};
        
        // 컴포넌트 타입별 데이터 추출 전략
        switch (type) {
            case 'aits-list':
                data.items = this.extractListItems(element);
                break;
                
            case 'aits-card':
                data.title = element.querySelector('.card-title')?.textContent;
                data.description = element.querySelector('.card-description')?.textContent;
                data.image = element.querySelector('.card-image img')?.getAttribute('src');
                break;
                
            case 'aits-form':
                data.fields = this.extractFormFields(element);
                break;
                
            case 'aits-pagination':
                data.currentPage = this.extractCurrentPage(element);
                data.totalPages = this.extractTotalPages(element);
                break;
                
            default:
                // 기본 추출: 텍스트 컨텐츠와 속성
                data.content = element.innerHTML;
                Array.from(element.attributes).forEach(attr => {
                    if (!attr.name.startsWith('data-aits-') && attr.name !== 'is') {
                        data[attr.name] = attr.value;
                    }
                });
        }
        
        return data;
    }
    
    /**
     * 요소에서 상태 추출
     */
    private extractStateFromElement(element: HTMLElement, type: string): any {
        const state: any = {};
        
        // data-* 속성에서 상태 추출
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-state-')) {
                const key = attr.name.replace('data-state-', '');
                try {
                    state[key] = JSON.parse(attr.value);
                } catch {
                    state[key] = attr.value;
                }
            }
        });
        
        // 컴포넌트별 특수 상태
        switch (type) {
            case 'aits-modal':
                state.open = element.hasAttribute('open');
                break;
                
            case 'aits-sort':
                state.direction = element.querySelector('.active')?.getAttribute('data-direction') || 'none';
                break;
                
            case 'aits-filter':
                state.filters = this.extractFilterState(element);
                break;
        }
        
        return state;
    }
    
    /**
     * 리스트 아이템 추출
     */
    private extractListItems(element: HTMLElement): any[] {
        const items: any[] = [];
        const children = element.children;
        
        for (let i = 0; i < children.length; i++) {
            const child = children[i] as HTMLElement;
            items.push({
                id: child.dataset.id || i,
                content: child.innerHTML,
                data: { ...child.dataset }
            });
        }
        
        return items;
    }
    
    /**
     * 폼 필드 추출
     */
    private extractFormFields(element: HTMLElement): any[] {
        const fields: any[] = [];
        const inputs = element.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            const field = input as HTMLInputElement;
            fields.push({
                name: field.name,
                type: field.type,
                value: field.value,
                required: field.required
            });
        });
        
        return fields;
    }
    
    /**
     * 현재 페이지 추출
     */
    private extractCurrentPage(element: HTMLElement): number {
        const active = element.querySelector('.active, [aria-current="page"]');
        return parseInt(active?.textContent || '1');
    }
    
    /**
     * 전체 페이지 수 추출
     */
    private extractTotalPages(element: HTMLElement): number {
        const numbers = element.querySelectorAll('.page-number');
        if (numbers.length > 0) {
            const lastNumber = numbers[numbers.length - 1];
            return parseInt(lastNumber.textContent || '1');
        }
        
        // "1 / 10" 형식 파싱
        const info = element.querySelector('.page-info');
        if (info) {
            const match = info.textContent?.match(/\d+\s*\/\s*(\d+)/);
            if (match) return parseInt(match[1]);
        }
        
        return 1;
    }
    
    /**
     * 필터 상태 추출
     */
    private extractFilterState(element: HTMLElement): Record<string, any> {
        const filters: Record<string, any> = {};
        const inputs = element.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            const field = input as HTMLInputElement;
            if (field.value) {
                filters[field.name] = field.value;
            }
        });
        
        return filters;
    }
    
    /**
     * 우선순위 계산
     */
    private calculatePriority(element: HTMLElement, type: string, index: number): number {
        let priority = 100 - index; // 기본: DOM 순서
        
        // 뷰포트에 보이는 요소 우선
        const rect = element.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight) {
            priority += 50;
        }
        
        // 특정 컴포넌트 타입 우선순위
        const typePriorities: Record<string, number> = {
            'aits-header': 1000,
            'aits-nav': 900,
            'aits-search': 800,
            'aits-form': 700
        };
        
        priority += typePriorities[type] || 0;
        
        // 명시적 우선순위 속성
        const explicitPriority = element.dataset.hydratePriority;
        if (explicitPriority) {
            priority = parseInt(explicitPriority) * 100;
        }
        
        return priority;
    }
    
    /**
     * 레이아웃 분석
     */
    private analyzeLayout(): LayoutAnalysis {
        return {
            hasHeader: !!document.querySelector('header, [data-aits-header]'),
            hasFooter: !!document.querySelector('footer, [data-aits-footer]'),
            hasSidebar: !!document.querySelector('aside, [data-aits-aside]'),
            mainContent: document.querySelector('main, [data-aits-main]') as HTMLElement
        };
    }
    
    /**
     * 라우트 분석
     */
    private analyzeRoute(): RouteAnalysis {
        const path = window.location.pathname;
        const searchParams = new URLSearchParams(window.location.search);
        
        // URL에서 파라미터 추출
        const params: Record<string, string> = {};
        const query: Record<string, string> = {};
        
        searchParams.forEach((value, key) => {
            query[key] = value;
        });
        
        // 컨트롤러 추론
        let controller: string | undefined;
        for (const [pattern, controllerName] of this.routePatterns) {
            const match = path.match(pattern);
            if (match) {
                controller = controllerName;
                // 캡처 그룹을 파라미터로
                match.slice(1).forEach((value, index) => {
                    params[`param${index}`] = value;
                });
                break;
            }
        }
        
        return { path, controller, params, query };
    }
    
    /**
     * Hydration 가능 여부 판단
     */
    private canHydrate(analysis: any): boolean {
        // 최소 하나 이상의 AITS 컴포넌트가 있어야 함
        return analysis.components.length > 0 || 
               analysis.layout.mainContent !== null;
    }
    
    /**
     * 라우트 설정
     */
    private async setupRoute(route: RouteAnalysis): Promise<void> {
        if (!route.controller) {
            console.log('[Hydrator] No controller found for route:', route.path);
            return;
        }
        
        // 라우트 정보를 Aits에 전달
        // 실제 구현은 Aits의 라우터와 연동
        console.log('[Hydrator] Setting up route:', route);
    }
    
    /**
     * 컴포넌트 Hydration
     */
    private async hydrateComponents(
        components: ComponentAnalysis[], 
        options: HydrationOptions
    ): Promise<number> {
        let hydratedCount = 0;
        
        for (const comp of components) {
            try {
                await this.hydrateComponent(comp, options);
                hydratedCount++;
            } catch (error) {
                console.error(`[Hydrator] Failed to hydrate ${comp.type}:`, error);
            }
        }
        
        return hydratedCount;
    }
    
    /**
     * 단일 컴포넌트 Hydration
     */
    private async hydrateComponent(
        analysis: ComponentAnalysis,
        options: HydrationOptions
    ): Promise<void> {
        const { element, type, data, state } = analysis;
        
        // 전략에 따른 Hydration 지연
        if (options.strategy && options.strategy !== 'immediate') {
            await this.waitForStrategy(element, options.strategy);
        }
        
        // 컴포넌트 클래스 가져오기
        const ComponentClass = COMPONENT_REGISTRY.get(type);
        if (!ComponentClass) {
            console.warn(`[Hydrator] Unknown component type: ${type}`);
            return;
        }
        
        // In-place enhancement (교체하지 않고 향상)
        this.enhanceElement(element, ComponentClass, data, state);
        
        console.log(`[Hydrator] Hydrated ${type}`);
    }
    
    /**
     * 전략에 따른 대기
     */
    private async waitForStrategy(
        element: HTMLElement, 
        strategy: string
    ): Promise<void> {
        switch (strategy) {
            case 'idle':
                await this.waitForIdle();
                break;
                
            case 'visible':
                await this.waitForVisible(element);
                break;
                
            case 'interactive':
                await this.waitForInteraction(element);
                break;
        }
    }
    
    /**
     * 유휴 시간 대기
     */
    private waitForIdle(): Promise<void> {
        return new Promise(resolve => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => resolve());
            } else {
                setTimeout(resolve, 0);
            }
        });
    }
    
    /**
     * 요소가 보일 때까지 대기
     */
    private waitForVisible(element: HTMLElement): Promise<void> {
        return new Promise(resolve => {
            const observer = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) {
                    observer.disconnect();
                    resolve();
                }
            });
            
            observer.observe(element);
            this.observers.set(element, observer);
        });
    }
    
    /**
     * 사용자 상호작용 대기
     */
    private waitForInteraction(element: HTMLElement): Promise<void> {
        return new Promise(resolve => {
            const events = ['click', 'focus', 'mouseenter', 'touchstart'];
            const handler = () => {
                events.forEach(event => 
                    element.removeEventListener(event, handler)
                );
                resolve();
            };
            
            events.forEach(event => 
                element.addEventListener(event, handler, { once: true })
            );
        });
    }
    
    /**
     * 요소 향상 (Enhancement)
     */
    private enhanceElement(
        element: HTMLElement,
        ComponentClass: any,
        data: any,
        state: any
    ): void {
        // 프로토타입 체인 수정
        Object.setPrototypeOf(element, ComponentClass.prototype);
        
        // 생성자 로직 실행 (부분적)
        ComponentClass.call(element);
        
        // 데이터와 상태 주입
        (element as any)._data = data;
        (element as any)._items = data.items || [];
        (element as any).state = { 
            ...state, 
            initialized: true,
            hydrated: true 
        };
        
        // Shadow DOM 건너뛰기 (이미 렌더링됨)
        (element as any).useShadowDOM = false;
        
        // 생명주기 메서드 호출
        if (typeof (element as any).initialize === 'function') {
            (element as any).initialize();
        }
        
        if (typeof (element as any).afterRender === 'function') {
            (element as any).afterRender();
        }
        
        // 컴포넌트 맵에 등록
        this.componentMap.set(element, element as AitsElement);
    }
    
    /**
     * 글로벌 이벤트 바인딩
     */
    private bindGlobalEvents(): void {
        // 링크 클릭 처리 (SPA 네비게이션)
        document.addEventListener('click', (e) => {
            const link = (e.target as Element).closest('a[data-navigo]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) {
                    this.aits.navigate(href);
                }
            }
        });
        
        // 폼 제출 처리
        document.addEventListener('submit', (e) => {
            const form = e.target as HTMLFormElement;
            if (form.hasAttribute('data-aits-form')) {
                e.preventDefault();
                // 폼 처리 로직
            }
        });
    }
    
    /**
     * 라우터 동기화
     */
    private syncRouter(): void {
        // 현재 URL과 라우터 상태 동기화
        this.aits.updatePageLinks();
        
        // History API 활성화
        console.log('[Hydrator] Router synchronized');
    }
    
    /**
     * SPA 모드로 폴백
     */
    private async fallbackToSpa(options: HydrationOptions): Promise<HydrationResult> {
        console.log('[Hydrator] Falling back to SPA mode');
        
        // 일반 SPA 초기화
        this.aits.run();
        
        return {
            success: true,
            mode: 'spa',
            components: 0,
            duration: performance.now() - this.startTime,
            errors: []
        };
    }
    
    /**
     * Hydration 완료 이벤트 발생
     */
    private emitHydrationComplete(result: HydrationResult): void {
        document.dispatchEvent(new CustomEvent('aits:hydrated', {
            detail: result,
            bubbles: true
        }));
    }
    
    /**
     * Hydration 상태 확인
     */
    public getHydrationState(): boolean {
        return this.isHydrated;
    }
    
    /**
     * Hydration 결과 가져오기
     */
    public getHydrationResult(): HydrationResult | null {
        return this.hydrationResult;
    }
    
    /**
     * 특정 컴포넌트만 Hydration
     */
    public async hydrateElement(element: HTMLElement): Promise<void> {
        const type = element.getAttribute('is');
        if (!type?.startsWith('aits-')) {
            throw new Error('Not an AITS component');
        }
        
        const analysis: ComponentAnalysis = {
            element,
            type,
            data: this.extractDataFromElement(element, type),
            state: this.extractStateFromElement(element, type),
            priority: 100
        };
        
        await this.hydrateComponent(analysis, {});
    }
    
    /**
     * 라우트 패턴 추가
     */
    public addRoutePattern(pattern: RegExp, controller: string): void {
        this.routePatterns.set(pattern, controller);
    }
    
    /**
     * 정리
     */
    public destroy(): void {
        // Observer 정리
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // 컴포넌트 맵 정리
        this.componentMap.clear();
        
        console.log('[Hydrator] Destroyed');
    }
}