/**
 * =================================================================
 * AitsElement.ts - AITS 컴포넌트 기반 클래스 (오류 수정 버전)
 * =================================================================
 * @description
 * - 이벤트 리스너 중복 방지
 * - 메모리 관리 개선
 * - 생명주기 정리
 * - isConnected 속성 충돌 해결
 * @author Aits Framework AI
 * @version 1.1.1
 */

export type ComponentSize = 'small' | 'medium' | 'large';
export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';

export interface ComponentState {
    loading: boolean;
    disabled: boolean;
    readonly: boolean;
    error: string | null;
    initialized: boolean;
}

export interface AitsEventOptions {
    bubbles?: boolean;
    composed?: boolean;
    cancelable?: boolean;
}

// 바운드 이벤트 핸들러 정보
interface BoundHandler {
    element: Element | Window | Document;
    eventType: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
}

export abstract class AitsElement extends HTMLElement {
    protected useShadowDOM: boolean = true;
    protected shadow: ShadowRoot | null = null;
    
    private _data: any = null;
    private _items: any[] = [];
    private _value: any = null;
    
    protected state: ComponentState = {
        loading: false,
        disabled: false,
        readonly: false,
        error: null,
        initialized: false
    };
    
    // 개선된 이벤트 관리
    private boundHandlers: Map<string, BoundHandler> = new Map();
    private eventListeners: Map<string, Set<EventListener>> = new Map();
    private cleanupFunctions: Set<() => void> = new Set();
    private renderCount: number = 0;
    private _isAitsConnected: boolean = false; // isConnected 충돌 방지를 위해 이름 변경
    
    constructor() {
        super();
        if (this.useShadowDOM) {
            this.shadow = this.attachShadow({ mode: 'open' });
        }
    }
    
    // === 생명주기 ===
    
    connectedCallback(): void {
        if (this._isAitsConnected) return; // 중복 연결 방지
        this._isAitsConnected = true;
        
        if (!this.state.initialized) {
            this.initialize();
            this.state.initialized = true;
        }
        
        this.render();
        this.afterRender();
        this.emit('connected');
    }
    
    disconnectedCallback(): void {
        if (!this._isAitsConnected) return;
        this._isAitsConnected = false;
        
        this.beforeDisconnect();
        this.cleanup();
        this.emit('disconnected');
    }
    
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (oldValue === newValue) return;
        
        this.onAttributeChange(name, oldValue, newValue);
        
        // 연결된 상태에서만 재렌더링
        if (this._isAitsConnected) {
            this.render();
        }
    }
    
    // === 초기화 ===
    
    protected initialize(): void {
        // 하위 클래스에서 초기 설정
    }
    
    protected beforeDisconnect(): void {
        // 하위 클래스에서 연결 해제 전 처리
    }
    
    // === 데이터 관리 ===
    
    get data(): any {
        return this._data;
    }
    
    set data(value: any) {
        const oldValue = this._data;
        this._data = value;
        this.onDataChange('data', oldValue, value);
        if (this._isAitsConnected) {
            this.render();
        }
    }
    
    get items(): any[] {
        return this._items;
    }
    
    set items(value: any[]) {
        const oldValue = this._items;
        this._items = value || [];
        this.onDataChange('items', oldValue, value);
        if (this._isAitsConnected) {
            this.render();
        }
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
        if (!this._isAitsConnected) return;
        
        this.renderCount++;
        const container = this.shadow || this;
        
        // 기존 이벤트 리스너 정리 (DOM이 교체되기 전)
        this.cleanupDOMHandlers();
        
        if (this.state.loading) {
            container.innerHTML = this.getLoadingTemplate();
            return;
        }
        
        if (this.state.error) {
            container.innerHTML = this.getErrorTemplate(this.state.error);
            return;
        }
        
        if (this.shouldShowEmpty()) {
            container.innerHTML = this.getEmptyTemplate();
            return;
        }
        
        container.innerHTML = this.getTemplate();
        
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
    
    // === 템플릿 메서드 ===
    
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
    
    // === 개선된 이벤트 관리 ===
    
    /**
     * 이벤트 리스너 추가 (중복 방지)
     */
    protected addEventHandler(
        element: Element | Window | Document | string,
        eventType: string,
        handler: EventListener,
        options?: boolean | AddEventListenerOptions
    ): void {
        const target = typeof element === 'string' 
            ? (this.shadow || this).querySelector(element)
            : element;
            
        if (!target) return;
        
        // 키 생성
        const key = this.getHandlerKey(target, eventType);
        
        // 기존 핸들러가 있으면 제거
        const existing = this.boundHandlers.get(key);
        if (existing) {
            existing.element.removeEventListener(existing.eventType, existing.handler, existing.options);
        }
        
        // 새 핸들러 등록
        target.addEventListener(eventType, handler, options);
        this.boundHandlers.set(key, {
            element: target,
            eventType,
            handler,
            options
        });
    }
    
    /**
     * 바운드 메서드로 이벤트 리스너 추가
     */
    protected bindEventHandler(
        element: Element | Window | Document | string,
        eventType: string,
        methodName: string,
        options?: boolean | AddEventListenerOptions
    ): void {
        const method = (this as any)[methodName];
        if (typeof method !== 'function') {
            console.error(`Method ${methodName} not found`);
            return;
        }
        
        const boundMethod = method.bind(this);
        this.addEventHandler(element, eventType, boundMethod, options);
    }
    
    private getHandlerKey(element: Element | Window | Document, eventType: string): string {
        if (element === window) return `window:${eventType}`;
        if (element === document) return `document:${eventType}`;
        if (element instanceof Element) {
            const id = element.id || element.className || element.tagName;
            return `${id}:${eventType}`;
        }
        return `unknown:${eventType}`;
    }
    
    /**
     * DOM 핸들러 정리
     */
    private cleanupDOMHandlers(): void {
        this.boundHandlers.forEach((handler, key) => {
            // window와 document 핸들러는 유지
            if (!key.startsWith('window:') && !key.startsWith('document:')) {
                handler.element.removeEventListener(
                    handler.eventType, 
                    handler.handler, 
                    handler.options
                );
                this.boundHandlers.delete(key);
            }
        });
    }
    
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
        if (this._isAitsConnected) {
            this.render();
        }
    }
    
    public setDisabled(disabled: boolean): void {
        this.state.disabled = disabled;
        this.toggleAttribute('disabled', disabled);
        
        if (!this.useShadowDOM) {
            this.querySelectorAll('input, button, select, textarea').forEach(el => {
                (el as HTMLInputElement).disabled = disabled;
            });
        }
    }
    
    public setError(error: string | null): void {
        this.state.error = error;
        this.toggleAttribute('error', !!error);
        if (this._isAitsConnected) {
            this.render();
        }
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
        // 모든 바운드 핸들러 제거
        this.boundHandlers.forEach(handler => {
            handler.element.removeEventListener(
                handler.eventType, 
                handler.handler, 
                handler.options
            );
        });
        this.boundHandlers.clear();
        
        // 이벤트 리스너 제거
        this.eventListeners.forEach((handlers, eventType) => {
            handlers.forEach(handler => {
                this.removeEventListener(eventType, handler);
            });
        });
        this.eventListeners.clear();
        
        // 정리 함수 실행
        this.cleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (e) {
                console.error('[AitsElement] Cleanup error:', e);
            }
        });
        this.cleanupFunctions.clear();
    }
    
    public destroy(): void {
        this.cleanup();
        this.remove();
    }
}