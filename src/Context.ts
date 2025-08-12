/**
 * =================================================================
 * Context.ts - 컨트롤러를 위한 만능 도구 상자 (개선된 버전)
 * =================================================================
 * @description
 * - 컨트롤러의 메소드가 실행될 때 주입되는 객체입니다.
 * - 타입 안전성이 강화된 반응형 상태 관리를 제공합니다.
 * @author Aits Framework AI
 * @version 0.3.0
 */

import type { Aits } from './Aits';
import type { Renderer } from './Renderer';
import type { LoadOptions } from './Loader';
import type { AitsElement } from './components';

// Navigo의 match 객체에서 필요한 정보만 추출하여 타입을 정의
export interface RouteInfo {
    url: string;                               // 매칭된 전체 URL
    path: string;                              // 파라미터가 적용된 경로
    route: string;                             // 등록된 원본 경로
    params: Record<string, string> | null;     // URL 파라미터
    query: Record<string, string>;             // 쿼리 스트링
}

// 바인딩 요소 정의
interface BoundElement {
    element: HTMLElement;
    property: string;
    transform?: (value: any) => any;
}

// 상태 옵저버 타입
type StateObserver<T = any> = (newValue: T, oldValue: T, key: string) => void;

// 반응형 상태 타입
export type ReactiveState<T extends Record<string, any> = Record<string, any>> = T;

export class Context<TState extends Record<string, any> = Record<string, any>> {
    public readonly aits: Aits;
    public readonly route: RouteInfo;
    public state: ReactiveState<TState>;  // 타입 안전성 개선
    
    private stateBindings: Map<string, BoundElement[]>;
    private stateObservers: Map<string, Set<StateObserver>>;
    private stateValues: Map<string, any>;
    private initialStateType?: TState;  // 초기 상태 타입 저장

    constructor(aitsInstance: Aits, navigoMatch: any = {}, initialState?: TState) {
        this.aits = aitsInstance;
        this.stateBindings = new Map();
        this.stateObservers = new Map();
        this.stateValues = new Map();

        // Navigo의 match 객체를 RouteInfo 형태로 가공
        this.route = this._parseRoute(navigoMatch);

        // 반응형 상태 프록시 생성 (초기값 포함)
        this.state = this._createReactiveState(initialState || {} as TState);
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
     * 반응형 상태 프록시 생성 (타입 안전성 강화)
     */
    private _createReactiveState<T extends Record<string, any>>(initial: T): ReactiveState<T> {
        const handler: ProxyHandler<T> = {
            get: (target: T, property: string | symbol): any => {
                if (typeof property !== 'string') return target[property as keyof T];
                
                const value = target[property as keyof T];
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    return this._createNestedProxy(value, property);
                }
                return value;
            },
            set: (target: T, property: string | symbol, value: any): boolean => {
                if (typeof property !== 'string') {
                    target[property as keyof T] = value;
                    return true;
                }
                
                const oldValue = this.stateValues.get(property);
                target[property as keyof T] = value;
                this.stateValues.set(property, value);
                
                if (oldValue !== value) {
                    this._notifyStateChange(property, value, oldValue);
                }
                
                return true;
            },
            deleteProperty: (target: T, property: string | symbol): boolean => {
                if (typeof property !== 'string') {
                    delete target[property as keyof T];
                    return true;
                }
                
                const oldValue = target[property as keyof T];
                delete target[property as keyof T];
                this.stateValues.delete(property);
                this._notifyStateChange(property, undefined, oldValue);
                return true;
            }
        };
        
        return new Proxy(initial, handler) as ReactiveState<T>;
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
                    this._notifyStateChange(parentKey, this.state[parentKey as keyof TState], this.state[parentKey as keyof TState]);
                }
                
                return true;
            }
        });
    }

    /**
     * 상태 변경 알림
     */
    private _notifyStateChange(key: string, newValue: any, oldValue: any): void {
        this._updateBoundElements(key, newValue);
        this._notifyObservers(key, newValue, oldValue);
    }

    /**
     * 상태와 UI 요소를 바인딩합니다 (타입 안전성 강화)
     */
    public bind<K extends keyof TState>(
        stateKey: K | string,
        element: HTMLElement,
        property: string,
        transform?: (value: TState[K] | any) => any
    ): void {
        const key = String(stateKey);
        
        if (!this.stateBindings.has(key)) {
            this.stateBindings.set(key, []);
        }
        
        this.stateBindings.get(key)!.push({
            element,
            property,
            transform
        });
        
        const currentValue = this._getNestedValue(key);
        if (currentValue !== undefined) {
            this._updateElement({ element, property, transform }, currentValue);
        }
    }

    /**
     * 바인딩 해제
     */
    public unbind(stateKey: keyof TState | string, element?: HTMLElement): void {
        const key = String(stateKey);
        
        if (!element) {
            this.stateBindings.delete(key);
        } else {
            const bindings = this.stateBindings.get(key);
            if (bindings) {
                const filtered = bindings.filter(b => b.element !== element);
                if (filtered.length > 0) {
                    this.stateBindings.set(key, filtered);
                } else {
                    this.stateBindings.delete(key);
                }
            }
        }
    }

    /**
     * 상태 변경 옵저버 등록 (타입 안전성 강화)
     */
    public observe<K extends keyof TState>(
        stateKey: K | string,
        callback: StateObserver<TState[K]>
    ): () => void {
        const key = String(stateKey);
        
        if (!this.stateObservers.has(key)) {
            this.stateObservers.set(key, new Set());
        }
        
        this.stateObservers.get(key)!.add(callback);
        
        return () => {
            const observers = this.stateObservers.get(key);
            if (observers) {
                observers.delete(callback);
                if (observers.size === 0) {
                    this.stateObservers.delete(key);
                }
            }
        };
    }

    /**
     * 바인딩된 요소들 업데이트
     */
    private _updateBoundElements(key: string, value: any): void {
        const exactBindings = this.stateBindings.get(key);
        if (exactBindings) {
            exactBindings.forEach(binding => {
                this._updateElement(binding, value);
            });
        }
        
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
     * 단일 요소 업데이트 (안전성 강화)
     */
    private _updateElement(binding: BoundElement, value: any): void {
        try {
            // DOM에서 제거된 요소 체크
            if (!document.body.contains(binding.element)) {
                // 자동으로 바인딩 제거
                this.cleanupStaleBindings();
                return;
            }
            
            const finalValue = binding.transform ? binding.transform(value) : value;
            
            // 특별한 속성 처리
            if (binding.property === 'class') {
                binding.element.className = String(finalValue);
            } else if (binding.property === 'style') {
                if (typeof finalValue === 'object') {
                    Object.assign(binding.element.style, finalValue);
                } else {
                    binding.element.setAttribute('style', String(finalValue));
                }
            } else if (binding.property === 'dataset') {
                if (typeof finalValue === 'object') {
                    Object.assign(binding.element.dataset, finalValue);
                }
            } else if (binding.property in binding.element) {
                (binding.element as any)[binding.property] = finalValue;
            } else {
                binding.element.setAttribute(binding.property, String(finalValue));
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
        let value: any = this.state;
        
        for (const k of keys) {
            if (value == null) return undefined;
            value = value[k];
        }
        
        return value;
    }

    /**
     * 상태 일괄 업데이트 (타입 안전)
     */
    public setState(updates: Partial<TState>): void {
        Object.entries(updates).forEach(([key, value]) => {
            (this.state as any)[key] = value;
        });
    }

    /**
     * 상태 초기화
     */
    public resetState(newState?: TState): void {
        // 모든 키에 대해 undefined로 설정하여 옵저버 트리거
        this.stateValues.forEach((_, key) => {
            (this.state as any)[key] = undefined;
        });
        
        // 프록시 재생성
        this.state = this._createReactiveState(newState || {} as TState);
        this.stateValues.clear();
    }

    /**
     * DOM에서 제거된 요소들의 바인딩 정리
     */
    private cleanupStaleBindings(): void {
        this.stateBindings.forEach((bindings, key) => {
            const validBindings = bindings.filter(b => document.body.contains(b.element));
            if (validBindings.length < bindings.length) {
                if (validBindings.length === 0) {
                    this.stateBindings.delete(key);
                } else {
                    this.stateBindings.set(key, validBindings);
                }
            }
        });
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
    
    public get renderer(): Renderer {
        return this.aits.getRenderer();
    }
    
    // === 컴포넌트 검색 메서드 ===
    
    /**
     * 단일 컴포넌트를 검색합니다.
     * @param selector - CSS 선택자
     * @returns 매칭된 컴포넌트 또는 null
     */
    public query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
        return this.renderer.query<T>(selector);
    }
    
    /**
     * 모든 매칭 컴포넌트를 검색합니다.
     * @param selector - CSS 선택자
     * @returns 매칭된 컴포넌트 배열
     */
    public queryAll<T extends HTMLElement = HTMLElement>(selector: string): T[] {
        return this.renderer.queryAll<T>(selector);
    }
    
    /**
     * 특정 타입의 컴포넌트를 검색합니다 (AitsElement 반환)
     * @param componentType - 컴포넌트 타입 (is 속성값)
     * @returns 해당 타입의 컴포넌트 배열
     * @example
     * const lists = ctx.queryByType('aits-list');
     */
    public queryByType(componentType: string): AitsElement[] {
        return this.renderer.queryByType(componentType);
    }
    
    /**
     * 특정 타입의 컴포넌트를 검색하고 타입 캐스팅합니다
     * @param componentType - 컴포넌트 타입 (is 속성값)
     * @returns 타입 캐스팅된 컴포넌트 배열
     * @example
     * import { AitsList } from './components';
     * const lists = ctx.queryByTypeAs<AitsList>('aits-list');
     */
    public queryByTypeAs<T extends AitsElement>(componentType: string): T[] {
        return this.renderer.queryByType(componentType) as T[];
    }
    
    /**
     * 컨테이너 내에서 컴포넌트를 검색합니다.
     * @param container - 검색할 컨테이너 요소
     * @param selector - CSS 선택자
     * @returns 매칭된 컴포넌트 또는 null
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
    
    public navigate(url: string): void {
        this.aits.navigate(url);
    }

    public redirect(url: string, replace: boolean = false): void {
        if (replace) {
            window.location.replace(url);
        } else {
            window.location.assign(url);
        }
    }

    public back(): void {
        this.aits.back();
    }

    public forward(): void {
        this.aits.forward();
    }

    public getCurrentRoute(): string {
        return this.aits.getCurrentRoute();
    }

    // === Loader 프록시 메서드 ===
    
    public html(src: string, options?: LoadOptions): Promise<string> {
        return this.aits.html(src, options);
    }
    
    public json<T = any>(src: string, options?: LoadOptions): Promise<T> {
        return this.aits.json<T>(src, options);
    }
    
    public script(src: string, options?: LoadOptions): Promise<void> {
        return this.aits.script(src, options);
    }
    
    public style(src: string, options?: LoadOptions): Promise<void> {
        return this.aits.style(src, options);
    }

    // === 유틸리티 메서드 ===
    
    public getQueryParam(key: string): string | undefined {
        return this.route.query[key];
    }

    public getParam(key: string): string | undefined {
        return this.route.params?.[key];
    }

    public buildQueryString(params: Record<string, any>): string {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        return searchParams.toString();
    }

    public buildUrl(path: string, params?: Record<string, any>): string {
        if (!params) return path;
        
        const queryString = this.buildQueryString(params);
        return queryString ? `${path}?${queryString}` : path;
    }
}