/**
 * =================================================================
 * Context.ts - 컨트롤러를 위한 만능 도구 상자
 * =================================================================
 * @description
 * - 컨트롤러의 메소드가 실행될 때 주입되는 객체입니다.
 * - 라우팅 정보, 반응형 상태 관리, 리소스 로더 접근 등
 * 페이지 제어에 필요한 모든 것을 제공합니다.
 * - AI가 가장 쉽게 상태를 관리하고 UI를 업데이트할 수 있도록
 * '반응형 상태(Reactive State)' 기능을 핵심으로 합니다.
 * @author Aits Framework AI
 * @version 0.2.0
 */

import type { Aits } from './Aits';
import type { Renderer } from './Renderer';
import type { LoadOptions } from './Loader';

// Navigo의 match 객체에서 필요한 정보만 추출하여 타입을 정의
export interface RouteInfo {
    url: string;                               // 매칭된 전체 URL (e.g., '/articles/123?sort=desc')
    path: string;                              // 파라미터가 적용된 경로 (e.g., '/articles/123')
    route: string;                             // 등록된 원본 경로 (e.g., '/articles/:id')
    params: Record<string, string> | null;     // URL 파라미터 (e.g., { id: '123' })
    query: Record<string, string>;             // 쿼리 스트링 (e.g., { sort: 'desc' })
}

// 바인딩 요소 정의
interface BoundElement {
    element: HTMLElement;
    property: string;
    transform?: (value: any) => any;  // 값 변환 함수 (옵션)
}

// 상태 옵저버 타입
type StateObserver = (newValue: any, oldValue: any, key: string) => void;

export class Context {
    public readonly aits: Aits;
    public readonly route: RouteInfo;
    public state: any;  // 반응형 상태 객체
    
    private stateBindings: Map<string, BoundElement[]>;
    private stateObservers: Map<string, Set<StateObserver>>;
    private stateValues: Map<string, any>;  // 이전 값 추적용

    constructor(aitsInstance: Aits, navigoMatch: any = {}) {
        this.aits = aitsInstance;
        this.stateBindings = new Map();
        this.stateObservers = new Map();
        this.stateValues = new Map();

        // Navigo의 match 객체를 RouteInfo 형태로 가공
        this.route = this._parseRoute(navigoMatch);

        // 반응형 상태 프록시 생성
        this.state = this._createReactiveState();
    }

    /**
     * Navigo match 객체를 RouteInfo로 변환
     */
    private _parseRoute(navigoMatch: any): RouteInfo {
        const urlParams = new URLSearchParams(navigoMatch.queryString || '');
        
        return {
            url: navigoMatch.url || '',
            path: navigoMatch.route?.path || '',
            route: navigoMatch.route?.name || navigoMatch.route?.path || '',
            params: navigoMatch.data || null,
            query: Object.fromEntries(urlParams.entries()),
        };
    }

    /**
     * 반응형 상태 프록시 생성
     */
    private _createReactiveState(): any {
        return new Proxy({}, {
            get: (target: any, property: string): any => {
                // 중첩 객체도 반응형으로 만들기
                const value = target[property];
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    return this._createNestedProxy(value, property);
                }
                return value;
            },
            set: (target: any, property: string, value: any): boolean => {
                const oldValue = this.stateValues.get(property);
                target[property] = value;
                this.stateValues.set(property, value);
                
                // 값이 실제로 변경된 경우에만 업데이트
                if (oldValue !== value) {
                    this._notifyStateChange(property, value, oldValue);
                }
                
                return true;
            },
            deleteProperty: (target: any, property: string): boolean => {
                const oldValue = target[property];
                delete target[property];
                this.stateValues.delete(property);
                this._notifyStateChange(property, undefined, oldValue);
                return true;
            }
        });
    }

    /**
     * 중첩 객체를 위한 프록시 생성
     */
    private _createNestedProxy(obj: any, parentKey: string): any {
        return new Proxy(obj, {
            set: (target: any, property: string, value: any): boolean => {
                target[property] = value;
                const fullKey = `${parentKey}.${property}`;
                const oldValue = this.stateValues.get(fullKey);
                this.stateValues.set(fullKey, value);
                
                if (oldValue !== value) {
                    this._notifyStateChange(fullKey, value, oldValue);
                    // 부모 키도 업데이트 알림
                    this._notifyStateChange(parentKey, this.state[parentKey], this.state[parentKey]);
                }
                
                return true;
            }
        });
    }

    /**
     * 상태 변경 알림
     */
    private _notifyStateChange(key: string, newValue: any, oldValue: any): void {
        // 바인딩된 요소 업데이트
        this._updateBoundElements(key, newValue);
        
        // 옵저버 호출
        this._notifyObservers(key, newValue, oldValue);
    }

    /**
     * 상태와 UI 요소를 바인딩합니다.
     * @param stateKey - 상태 키 (중첩 지원: 'user.name')
     * @param element - 바인딩할 요소
     * @param property - 업데이트할 속성
     * @param transform - 값 변환 함수 (옵션)
     */
    public bind(
        stateKey: string, 
        element: HTMLElement, 
        property: string,
        transform?: (value: any) => any
    ): void {
        if (!this.stateBindings.has(stateKey)) {
            this.stateBindings.set(stateKey, []);
        }
        
        this.stateBindings.get(stateKey)!.push({ 
            element, 
            property,
            transform 
        });
        
        // 초기값 설정
        const currentValue = this._getNestedValue(stateKey);
        if (currentValue !== undefined) {
            this._updateElement({ element, property, transform }, currentValue);
        }
    }

    /**
     * 바인딩 해제
     */
    public unbind(stateKey: string, element?: HTMLElement): void {
        if (!element) {
            // 키에 대한 모든 바인딩 제거
            this.stateBindings.delete(stateKey);
        } else {
            // 특정 요소만 제거
            const bindings = this.stateBindings.get(stateKey);
            if (bindings) {
                const filtered = bindings.filter(b => b.element !== element);
                if (filtered.length > 0) {
                    this.stateBindings.set(stateKey, filtered);
                } else {
                    this.stateBindings.delete(stateKey);
                }
            }
        }
    }

    /**
     * 상태 변경 옵저버 등록
     */
    public observe(stateKey: string, callback: StateObserver): () => void {
        if (!this.stateObservers.has(stateKey)) {
            this.stateObservers.set(stateKey, new Set());
        }
        
        this.stateObservers.get(stateKey)!.add(callback);
        
        // 구독 해제 함수 반환
        return () => {
            const observers = this.stateObservers.get(stateKey);
            if (observers) {
                observers.delete(callback);
                if (observers.size === 0) {
                    this.stateObservers.delete(stateKey);
                }
            }
        };
    }

    /**
     * 바인딩된 요소들 업데이트
     */
    private _updateBoundElements(key: string, value: any): void {
        // 정확한 키 매칭
        const exactBindings = this.stateBindings.get(key);
        if (exactBindings) {
            exactBindings.forEach(binding => {
                this._updateElement(binding, value);
            });
        }
        
        // 와일드카드 매칭 (부모 키가 변경된 경우 자식들도 업데이트)
        this.stateBindings.forEach((bindings, bindingKey) => {
            if (bindingKey.startsWith(key + '.')) {
                const nestedValue = this._getNestedValue(bindingKey);
                bindings.forEach(binding => {
                    this._updateElement(binding, nestedValue);
                });
            }
        });
    }

    /**
     * 단일 요소 업데이트
     */
    private _updateElement(binding: BoundElement, value: any): void {
        try {
            // DOM에서 제거된 요소 체크
            if (!document.body.contains(binding.element)) {
                return;
            }
            
            const finalValue = binding.transform ? binding.transform(value) : value;
            
            // 특별한 속성 처리
            if (binding.property === 'class') {
                binding.element.className = String(finalValue);
            } else if (binding.property === 'style') {
                Object.assign(binding.element.style, finalValue);
            } else if (binding.property === 'dataset') {
                Object.assign(binding.element.dataset, finalValue);
            } else {
                (binding.element as any)[binding.property] = finalValue;
            }
        } catch (e) {
            console.error(`[Context] Error updating element:`, e);
        }
    }

    /**
     * 옵저버들에게 알림
     */
    private _notifyObservers(key: string, newValue: any, oldValue: any): void {
        const observers = this.stateObservers.get(key);
        if (observers) {
            observers.forEach(observer => {
                try {
                    observer(newValue, oldValue, key);
                } catch (e) {
                    console.error(`[Context] Error in state observer:`, e);
                }
            });
        }
    }

    /**
     * 중첩된 키로 값 가져오기
     */
    private _getNestedValue(key: string): any {
        const keys = key.split('.');
        let value = this.state;
        
        for (const k of keys) {
            if (value == null) return undefined;
            value = value[k];
        }
        
        return value;
    }

    /**
     * 상태 일괄 업데이트 (여러 값을 한번에 업데이트)
     */
    public setState(updates: Record<string, any>): void {
        Object.entries(updates).forEach(([key, value]) => {
            this.state[key] = value;
        });
    }

    /**
     * 상태 초기화
     */
    public resetState(): void {
        // 모든 키에 대해 undefined로 설정하여 옵저버 트리거
        this.stateValues.forEach((_, key) => {
            this.state[key] = undefined;
        });
        
        // 프록시 재생성
        this.state = this._createReactiveState();
        this.stateValues.clear();
    }

    /**
     * 모든 바인딩과 옵저버 정리
     */
    public cleanup(): void {
        this.stateBindings.clear();
        this.stateObservers.clear();
        this.stateValues.clear();
    }

    // === Renderer 접근 ===
    
    /**
     * Renderer 인스턴스 가져오기
     */
    public get renderer(): Renderer {
        return this.aits.getRenderer();
    }
    
    // === 컴포넌트 검색 메서드 ===
    
    /**
     * 단일 컴포넌트를 검색합니다.
     * @param selector - CSS 선택자
     * @returns 매칭된 컴포넌트 또는 null
     * @example
     * const list = ctx.query<AitsList>('#user-list');
     * const form = ctx.query<AitsForm>('[is="aits-form"]');
     */
    public query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
        return this.renderer.query<T>(selector);
    }
    
    /**
     * 모든 매칭 컴포넌트를 검색합니다.
     * @param selector - CSS 선택자
     * @returns 매칭된 컴포넌트 배열
     * @example
     * const forms = ctx.queryAll<AitsForm>('[is="aits-form"]');
     * const buttons = ctx.queryAll<HTMLButtonElement>('button.primary');
     */
    public queryAll<T extends HTMLElement = HTMLElement>(selector: string): T[] {
        return this.renderer.queryAll<T>(selector);
    }
    
    /**
     * 특정 타입의 컴포넌트만 검색합니다.
     * @param componentType - 컴포넌트 타입 (is 속성값)
     * @returns 해당 타입의 컴포넌트 배열
     * @example
     * const lists = ctx.queryByType<AitsList>('aits-list');
     * const forms = ctx.queryByType<AitsForm>('aits-form');
     */
    public queryByType<T extends HTMLElement = HTMLElement>(componentType: string): T[] {
        return this.renderer.queryByType<T>(componentType);
    }
    
    /**
     * 컨테이너 내에서 컴포넌트를 검색합니다.
     * @param container - 검색할 컨테이너 요소
     * @param selector - CSS 선택자
     * @returns 매칭된 컴포넌트 또는 null
     * @example
     * const sidebar = ctx.query('#sidebar');
     * const nav = ctx.queryIn<AitsNav>(sidebar, '[is="aits-nav"]');
     */
    public queryIn<T extends HTMLElement = HTMLElement>(
        container: HTMLElement | null, 
        selector: string
    ): T | null {
        return this.renderer.queryIn<T>(container, selector);
    }
    
    /**
     * 컨테이너 내의 모든 매칭 컴포넌트를 검색합니다.
     * @param container - 검색할 컨테이너 요소
     * @param selector - CSS 선택자
     * @returns 매칭된 컴포넌트 배열
     * @example
     * const main = ctx.query('main');
     * const cards = ctx.queryAllIn<AitsCard>(main, '[is="aits-card"]');
     */
    public queryAllIn<T extends HTMLElement = HTMLElement>(
        container: HTMLElement | null, 
        selector: string
    ): T[] {
        return this.renderer.queryAllIn<T>(container, selector);
    }
    
    /**
     * 컴포넌트가 활성화되었는지 확인합니다.
     * @param element - 확인할 요소
     * @returns 활성화 여부
     */
    public isComponentActivated(element: HTMLElement): boolean {
        return this.renderer.isComponentActivated(element);
    }

    // === Navigation 메서드 ===
    
    /**
     * 내부 페이지 이동
     */
    public navigate(url: string): void {
        this.aits.navigate(url);
    }

    /**
     * 외부 URL 리다이렉트
     */
    public redirect(url: string, replace: boolean = false): void {
        if (replace) {
            window.location.replace(url);
        } else {
            window.location.assign(url);
        }
    }

    /**
     * 뒤로 가기
     */
    public back(): void {
        this.aits.back();
    }

    /**
     * 앞으로 가기
     */
    public forward(): void {
        this.aits.forward();
    }

    /**
     * 현재 경로 가져오기
     */
    public getCurrentRoute(): string {
        return this.aits.getCurrentRoute();
    }

    // === Loader 프록시 메서드 ===
    
    /**
     * HTML 로드
     */
    public html(src: string, options?: LoadOptions): Promise<string> {
        return this.aits.html(src, options);
    }
    
    /**
     * JSON 로드
     */
    public json<T = any>(src: string, options?: LoadOptions): Promise<T> {
        return this.aits.json<T>(src, options);
    }
    
    /**
     * 스크립트 로드
     */
    public script(src: string, options?: LoadOptions): Promise<void> {
        return this.aits.script(src, options);
    }
    
    /**
     * 스타일시트 로드
     */
    public style(src: string, options?: LoadOptions): Promise<void> {
        return this.aits.style(src, options);
    }

    // === 유틸리티 메서드 ===
    
    /**
     * 쿼리 파라미터 가져오기
     */
    public getQueryParam(key: string): string | undefined {
        return this.route.query[key];
    }

    /**
     * URL 파라미터 가져오기
     */
    public getParam(key: string): string | undefined {
        return this.route.params?.[key];
    }

    /**
     * 쿼리 스트링 생성
     */
    public buildQueryString(params: Record<string, any>): string {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        return searchParams.toString();
    }

    /**
     * URL 생성 (파라미터 포함)
     */
    public buildUrl(path: string, params?: Record<string, any>): string {
        if (!params) return path;
        
        const queryString = this.buildQueryString(params);
        return queryString ? `${path}?${queryString}` : path;
    }
}