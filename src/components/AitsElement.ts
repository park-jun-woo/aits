/**
 * =================================================================
 * AitsElement.ts - AITS 컴포넌트 기반 클래스
 * =================================================================
 * @description
 * - 모든 AITS 컴포넌트의 부모 클래스입니다.
 * - customElements.define을 사용하지 않고 Renderer가 직접 활성화합니다.
 * - Shadow DOM, 데이터 바인딩, 이벤트 처리 등 공통 기능을 제공합니다.
 * @author Aits Framework AI
 * @version 0.3.0
 */

// 컴포넌트 상태 타입
export interface ComponentState {
    loading: boolean;
    error: string | null;
    initialized: boolean;
}

// 데이터 변경 이벤트
export interface DataChangeEvent<T = any> {
    oldValue: T | null;
    newValue: T | null;
    property: string;
}

export class AitsElement extends HTMLElement {
    // Shadow DOM 루트
    protected shadow: ShadowRoot;
    
    // 컴포넌트 데이터
    private _data: any = null;
    private _items: any[] = [];
    private _options: Record<string, any> = {};
    
    // 컴포넌트 상태
    private _state: ComponentState = {
        loading: false,
        error: null,
        initialized: false
    };
    
    // 템플릿 캐싱
    protected template: string = '';
    private compiledTemplate: Function | null = null;
    
    // 이벤트 리스너 추적
    private eventListeners: Map<string, Set<EventListener>> = new Map();
    
    // 활성화 상태
    private _activated: boolean = false;
    
    // MutationObserver
    private observer: MutationObserver | null = null;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    // === 생명주기 메서드 ===

    /**
     * 컴포넌트가 DOM에 연결될 때
     */
    connectedCallback(): void {
        if (!this._state.initialized) {
            this.template = this.innerHTML;
            this.innerHTML = '';
            this._state.initialized = true;
        }
        
        this.render();
        this.afterRender();
        
        // 활성화 상태 확인
        this._activated = true;
        this.dispatchComponentEvent('connected');
    }

    /**
     * 컴포넌트가 DOM에서 제거될 때
     */
    disconnectedCallback(): void {
        this.cleanup();
        this._activated = false;
        this.dispatchComponentEvent('disconnected');
    }

    /**
     * 속성이 변경될 때
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        this.onAttributeChange(name, oldValue, newValue);
    }

    /**
     * 관찰할 속성 목록
     */
    static get observedAttributes(): string[] {
        return ['data-bind', 'data-items', 'data-options'];
    }

    // === 데이터 관리 ===

    /**
     * 단일 데이터 getter/setter
     */
    get data(): any {
        return this._data;
    }

    set data(value: any) {
        const oldValue = this._data;
        this._data = value;
        this.onDataChange('data', oldValue, value);
        this.render();
    }

    /**
     * 목록 데이터 getter/setter
     */
    get items(): any[] {
        return this._items;
    }

    set items(value: any[]) {
        const oldValue = this._items;
        this._items = value || [];
        this.onDataChange('items', oldValue, value);
        this.render();
    }

    /**
     * 옵션 데이터 getter/setter
     */
    get options(): Record<string, any> {
        return this._options;
    }

    set options(value: Record<string, any>) {
        const oldValue = this._options;
        this._options = value || {};
        this.onDataChange('options', oldValue, value);
        this.render();
    }

    /**
     * 컴포넌트 상태 getter
     */
    get state(): ComponentState {
        return this._state;
    }

    /**
     * 활성화 상태 확인
     */
    get isActivated(): boolean {
        return this._activated || (this as any).__aitsActivated === true;
    }

    // === 렌더링 ===

    /**
     * 컴포넌트를 렌더링합니다.
     */
    protected render(): void {
        if (this._state.loading) {
            this.renderLoading();
            return;
        }

        if (this._state.error) {
            this.renderError(this._state.error);
            return;
        }

        if (!this._data && this._items.length === 0) {
            this.renderEmpty();
            return;
        }

        // 템플릿 렌더링
        const html = this.renderTemplate(this.template, {
            data: this._data,
            items: this._items,
            options: this._options
        });

        this.shadow.innerHTML = html;
        this.applyStyles();
    }

    /**
     * 로딩 상태 렌더링
     */
    protected renderLoading(): void {
        this.shadow.innerHTML = `
            <div class="aits-loading">
                <slot name="loading">Loading...</slot>
            </div>
        `;
    }

    /**
     * 에러 상태 렌더링
     */
    protected renderError(error: string): void {
        this.shadow.innerHTML = `
            <div class="aits-error">
                <slot name="error">${error}</slot>
            </div>
        `;
    }

    /**
     * 빈 상태 렌더링
     */
    protected renderEmpty(): void {
        this.shadow.innerHTML = `
            <div class="aits-empty">
                <slot name="empty">No data available</slot>
            </div>
        `;
    }

    /**
     * 스타일 적용
     */
    protected applyStyles(): void {
        const style = document.createElement('style');
        style.textContent = this.getStyles();
        
        const existingStyle = this.shadow.querySelector('style');
        if (existingStyle) {
            existingStyle.replaceWith(style);
        } else {
            this.shadow.prepend(style);
        }
    }

    /**
     * 컴포넌트 스타일 정의 (오버라이드 가능)
     */
    protected getStyles(): string {
        return `
            :host {
                display: block;
                box-sizing: border-box;
            }
            
            .aits-loading,
            .aits-error,
            .aits-empty {
                padding: 1rem;
                text-align: center;
                color: var(--text-secondary, #666);
            }
            
            .aits-error {
                color: var(--error-color, #d32f2f);
            }
        `;
    }

    // === 템플릿 처리 ===

    /**
     * 템플릿 렌더링 (개선된 버전)
     */
    protected renderTemplate(template: string, context: any): string {
        // 템플릿 컴파일 (캐싱)
        if (!this.compiledTemplate) {
            this.compiledTemplate = this.compileTemplate(template);
        }

        try {
            return this.compiledTemplate(context);
        } catch (error) {
            console.error('[AitsElement] Template rendering error:', error);
            return '';
        }
    }

    /**
     * 템플릿 컴파일
     */
    private compileTemplate(template: string): Function {
        // 간단한 템플릿 엔진 구현
        return (context: any) => {
            return template
                // 변수 치환 ${variable}
                .replace(/\$\{([^}]+)\}/g, (match, path) => {
                    const value = this.getNestedValue(context, path.trim());
                    return value !== undefined ? String(value) : '';
                })
                // 조건문 ${if:condition}...${/if}
                .replace(/\$\{if:([^}]+)\}([\s\S]*?)\$\{\/if\}/g, (match, condition, content) => {
                    const value = this.getNestedValue(context, condition.trim());
                    return value ? content : '';
                })
                // 반복문 ${each:items}...${/each}
                .replace(/\$\{each:([^}]+)\}([\s\S]*?)\$\{\/each\}/g, (match, path, content) => {
                    const items = this.getNestedValue(context, path.trim());
                    if (!Array.isArray(items)) return '';
                    
                    return items.map((item, index) => {
                        return content
                            .replace(/\$\{item\.([^}]+)\}/g, (_match: string, prop: string) => {
                                const value = this.getNestedValue(item, prop.trim());
                                return value !== undefined ? String(value) : '';
                            })
                            .replace(/\$\{index\}/g, String(index));
                    }).join('');
                });
        };
    }

    /**
     * 중첩된 객체에서 값 가져오기
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => {
            return current?.[key];
        }, obj);
    }

    // === 이벤트 처리 ===

    /**
     * 컴포넌트 이벤트 발생
     */
    protected dispatchComponentEvent(eventName: string, detail?: any): void {
        this.dispatchEvent(new CustomEvent(`aits-${eventName}`, {
            detail,
            bubbles: true,
            composed: true
        }));
    }

    /**
     * 이벤트 리스너 추가 (자동 정리)
     */
    public on(eventType: string, handler: EventListener): void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }
        
        this.eventListeners.get(eventType)!.add(handler);
        this.addEventListener(eventType, handler);
    }

    /**
     * 이벤트 리스너 제거
     */
    public off(eventType: string, handler?: EventListener): void {
        if (!this.eventListeners.has(eventType)) return;
        
        const handlers = this.eventListeners.get(eventType)!;
        
        if (handler) {
            handlers.delete(handler);
            this.removeEventListener(eventType, handler);
        } else {
            // 모든 핸들러 제거
            handlers.forEach(h => this.removeEventListener(eventType, h));
            handlers.clear();
        }
    }

    /**
     * 한 번만 실행되는 이벤트 리스너
     */
    public once(eventType: string, handler: EventListener): void {
        const onceHandler = (event: Event) => {
            handler(event);
            this.off(eventType, onceHandler);
        };
        
        this.on(eventType, onceHandler);
    }

    // === 콜백 메서드 (오버라이드 가능) ===

    /**
     * 데이터 변경 시 호출
     */
    protected onDataChange(property: string, oldValue: any, newValue: any): void {
        this.dispatchComponentEvent('data-change', {
            property,
            oldValue,
            newValue
        } as DataChangeEvent);
    }

    /**
     * 속성 변경 시 호출
     */
    protected onAttributeChange(name: string, oldValue: string | null, newValue: string | null): void {
        // 하위 클래스에서 구현
    }

    /**
     * 렌더링 완료 후 호출
     */
    protected afterRender(): void {
        // 하위 클래스에서 구현
    }

    // === 유틸리티 메서드 ===

    /**
     * 로딩 상태 설정
     */
    public setLoading(loading: boolean): void {
        this._state.loading = loading;
        this.render();
    }

    /**
     * 에러 상태 설정
     */
    public setError(error: string | null): void {
        this._state.error = error;
        this.render();
    }

    /**
     * Shadow DOM 내의 요소 검색
     */
    public $(selector: string): Element | null {
        return this.shadow.querySelector(selector);
    }

    /**
     * Shadow DOM 내의 모든 요소 검색
     */
    public $$(selector: string): NodeListOf<Element> {
        return this.shadow.querySelectorAll(selector);
    }

    /**
     * 슬롯 콘텐츠 가져오기
     */
    public getSlot(name?: string): HTMLSlotElement | null {
        const selector = name ? `slot[name="${name}"]` : 'slot:not([name])';
        return this.shadow.querySelector(selector);
    }

    /**
     * 슬롯에 할당된 요소들 가져오기
     */
    public getSlotElements(name?: string): Element[] {
        const slot = this.getSlot(name);
        return slot ? slot.assignedElements() : [];
    }

    // === 정리 ===

    /**
     * 컴포넌트 정리
     */
    protected cleanup(): void {
        // 이벤트 리스너 제거
        this.eventListeners.forEach((handlers, eventType) => {
            handlers.forEach(handler => {
                this.removeEventListener(eventType, handler);
            });
        });
        this.eventListeners.clear();
        
        // Observer 정리
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // 템플릿 캐시 정리
        this.compiledTemplate = null;
    }

    /**
     * 컴포넌트 파괴
     */
    public destroy(): void {
        this.cleanup();
        this.remove();
    }
}