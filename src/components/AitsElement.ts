/**
 * =================================================================
 * AitsElement.ts - AITS 컴포넌트 기반 클래스 (개선된 버전)
 * =================================================================
 * @description
 * - 모든 AITS 컴포넌트의 부모 클래스입니다.
 * - Shoelace 스타일의 일관된 API를 제공합니다.
 * - AI가 쉽게 이해하고 생성할 수 있는 패턴을 따릅니다.
 * @author Aits Framework AI
 * @version 1.0.0
 */

// 컴포넌트 크기 타입
export type ComponentSize = 'small' | 'medium' | 'large';

// 컴포넌트 변형 타입
export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';

// 컴포넌트 상태
export interface ComponentState {
    loading: boolean;
    disabled: boolean;
    readonly: boolean;
    error: string | null;
    initialized: boolean;
}

// 이벤트 옵션
export interface AitsEventOptions {
    bubbles?: boolean;
    composed?: boolean;
    cancelable?: boolean;
}

export abstract class AitsElement extends HTMLElement {
    // Shadow DOM 사용 여부 (폼 요소는 false)
    protected useShadowDOM: boolean = true;
    protected shadow: ShadowRoot | null = null;
    
    // 컴포넌트 데이터
    private _data: any = null;
    private _items: any[] = [];
    private _value: any = null;
    
    // 컴포넌트 상태
    protected state: ComponentState = {
        loading: false,
        disabled: false,
        readonly: false,
        error: null,
        initialized: false
    };
    
    // 이벤트 리스너 관리
    private eventListeners: Map<string, Set<EventListener>> = new Map();
    private cleanupFunctions: Set<() => void> = new Set();
    
    constructor() {
        super();
        if (this.useShadowDOM) {
            this.shadow = this.attachShadow({ mode: 'open' });
        }
    }
    
    // === 생명주기 ===
    
    connectedCallback(): void {
        if (!this.state.initialized) {
            this.initialize();
            this.state.initialized = true;
        }
        this.render();
        this.afterRender();
        this.emit('connected');
    }
    
    disconnectedCallback(): void {
        this.cleanup();
        this.emit('disconnected');
    }
    
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (oldValue === newValue) return;
        this.onAttributeChange(name, oldValue, newValue);
        this.render();
    }
    
    // === 초기화 ===
    
    protected initialize(): void {
        // 하위 클래스에서 초기 설정
    }
    
    // === 데이터 관리 ===
    
    get data(): any {
        return this._data;
    }
    
    set data(value: any) {
        const oldValue = this._data;
        this._data = value;
        this.onDataChange('data', oldValue, value);
        this.render();
    }
    
    get items(): any[] {
        return this._items;
    }
    
    set items(value: any[]) {
        const oldValue = this._items;
        this._items = value || [];
        this.onDataChange('items', oldValue, value);
        this.render();
    }
    
    get value(): any {
        return this._value;
    }
    
    set value(val: any) {
        const oldValue = this._value;
        this._value = val;
        this.onDataChange('value', oldValue, val);
        this.emit('change', { value: val, oldValue });
    }
    
    // === 렌더링 ===
    
    protected render(): void {
        const container = this.shadow || this;
        
        // 로딩 상태
        if (this.state.loading) {
            container.innerHTML = this.getLoadingTemplate();
            return;
        }
        
        // 에러 상태
        if (this.state.error) {
            container.innerHTML = this.getErrorTemplate(this.state.error);
            return;
        }
        
        // 빈 상태
        if (this.shouldShowEmpty()) {
            container.innerHTML = this.getEmptyTemplate();
            return;
        }
        
        // 정상 렌더링
        container.innerHTML = this.getTemplate();
        
        // 스타일 적용 (Shadow DOM인 경우)
        if (this.shadow) {
            this.applyStyles();
        }
    }
    
    protected shouldShowEmpty(): boolean {
        return !this._data && this._items.length === 0 && !this.hasChildNodes();
    }
    
    protected applyStyles(): void {
        if (!this.shadow) return;
        
        let style = this.shadow.querySelector('style');
        if (!style) {
            style = document.createElement('style');
            this.shadow.prepend(style);
        }
        
        style.textContent = `
            ${this.getBaseStyles()}
            ${this.getStyles()}
        `;
    }
    
    // === 템플릿 메서드 (하위 클래스에서 구현) ===
    
    protected abstract getTemplate(): string;
    
    protected getStyles(): string {
        return '';
    }
    
    protected getBaseStyles(): string {
        return `
            :host {
                display: block;
                box-sizing: border-box;
            }
            
            :host([hidden]) {
                display: none !important;
            }
            
            :host([disabled]) {
                pointer-events: none;
                opacity: 0.5;
            }
            
            * {
                box-sizing: border-box;
            }
        `;
    }
    
    protected getLoadingTemplate(): string {
        return `
            <div class="aits-loading" part="loading">
                <slot name="loading">
                    <span class="spinner"></span>
                    Loading...
                </slot>
            </div>
        `;
    }
    
    protected getErrorTemplate(error: string): string {
        return `
            <div class="aits-error" part="error">
                <slot name="error">
                    <span class="error-icon">⚠️</span>
                    ${this.escapeHtml(error)}
                </slot>
            </div>
        `;
    }
    
    protected getEmptyTemplate(): string {
        return `
            <div class="aits-empty" part="empty">
                <slot name="empty">
                    <span class="empty-icon">📭</span>
                    No data available
                </slot>
            </div>
        `;
    }
    
    // === 속성 헬퍼 ===
    
    protected getAttr(name: string, defaultValue: string = ''): string {
        return this.getAttribute(name) || defaultValue;
    }
    
    protected getBoolAttr(name: string): boolean {
        return this.hasAttribute(name);
    }
    
    protected getNumberAttr(name: string, defaultValue: number = 0): number {
        const value = this.getAttribute(name);
        return value ? parseFloat(value) : defaultValue;
    }
    
    // === 이벤트 관리 ===
    
    protected emit<T = any>(
        eventName: string, 
        detail?: T, 
        options: AitsEventOptions = {}
    ): boolean {
        const event = new CustomEvent(`aits:${eventName}`, {
            detail,
            bubbles: options.bubbles !== false,
            composed: options.composed !== false,
            cancelable: options.cancelable !== false
        });
        
        return this.dispatchEvent(event);
    }
    
    public on(eventType: string, handler: EventListener): void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }
        
        this.eventListeners.get(eventType)!.add(handler);
        this.addEventListener(eventType, handler);
    }
    
    public off(eventType: string, handler?: EventListener): void {
        const handlers = this.eventListeners.get(eventType);
        if (!handlers) return;
        
        if (handler) {
            handlers.delete(handler);
            this.removeEventListener(eventType, handler);
        } else {
            handlers.forEach(h => this.removeEventListener(eventType, h));
            handlers.clear();
        }
    }
    
    public once(eventType: string, handler: EventListener): void {
        const onceHandler = (event: Event) => {
            handler(event);
            this.off(eventType, onceHandler);
        };
        this.on(eventType, onceHandler);
    }
    
    // === 상태 관리 ===
    
    public setLoading(loading: boolean): void {
        this.state.loading = loading;
        this.toggleAttribute('loading', loading);
        this.render();
    }
    
    public setDisabled(disabled: boolean): void {
        this.state.disabled = disabled;
        this.toggleAttribute('disabled', disabled);
        if (!this.useShadowDOM) {
            // Light DOM 요소들도 비활성화
            this.querySelectorAll('input, button, select, textarea').forEach(el => {
                (el as HTMLInputElement).disabled = disabled;
            });
        }
    }
    
    public setError(error: string | null): void {
        this.state.error = error;
        this.toggleAttribute('error', !!error);
        this.render();
    }
    
    // === DOM 쿼리 헬퍼 ===
    
    public $(selector: string): Element | null {
        return (this.shadow || this).querySelector(selector);
    }
    
    public $$(selector: string): NodeListOf<Element> {
        return (this.shadow || this).querySelectorAll(selector);
    }
    
    // === 유틸리티 ===
    
    protected escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    protected interpolate(template: string, data: any): string {
        return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (match, key) => {
            const keys = key.trim().split('.');
            let value = data;
            
            for (const k of keys) {
                value = value?.[k];
            }
            
            return value !== undefined ? String(value) : '';
        });
    }
    
    protected addCleanup(cleanup: () => void): void {
        this.cleanupFunctions.add(cleanup);
    }
    
    // === 라이프사이클 훅 ===
    
    protected afterRender(): void {
        // 하위 클래스에서 구현
    }
    
    protected onAttributeChange(name: string, oldValue: string | null, newValue: string | null): void {
        // 하위 클래스에서 구현
    }
    
    protected onDataChange(property: string, oldValue: any, newValue: any): void {
        this.emit('data-change', { property, oldValue, newValue });
    }
    
    // === 정리 ===
    
    protected cleanup(): void {
        // 이벤트 리스너 제거
        this.eventListeners.forEach((handlers, eventType) => {
            handlers.forEach(handler => {
                this.removeEventListener(eventType, handler);
            });
        });
        this.eventListeners.clear();
        
        // 정리 함수 실행
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions.clear();
    }
    
    public destroy(): void {
        this.cleanup();
        this.remove();
    }
}