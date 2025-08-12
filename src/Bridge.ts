/**
 * =================================================================
 * Bridge.ts - 외부 웹 컴포넌트 라이브러리 브리지 시스템
 * =================================================================
 * @description
 * - is="*-*" 패턴을 실제 웹 컴포넌트로 변환하는 브리지 시스템
 * - Shoelace, Material Web Components 등 다양한 라이브러리 지원
 * - 속성, 이벤트, 슬롯을 자동으로 매핑
 * @author Aits Framework AI
 * @version 1.0.0
 */

// 브리지 설정 인터페이스
export interface BridgeConfig {
    prefix: string;           // 컴포넌트 접두사 (예: 'sl', 'md')
    library: string;          // 라이브러리 이름
    version?: string;         // 라이브러리 버전
    cdnUrl?: string;          // CDN URL
    loadStrategy?: 'lazy' | 'eager' | 'manual';  // 로딩 전략
    transformations?: ComponentTransformMap;       // 컴포넌트별 변환 규칙
}

// 컴포넌트 변환 규칙
export interface ComponentTransform {
    // 속성 매핑
    attributes?: {
        rename?: Record<string, string>;     // 속성명 변경
        remove?: string[];                   // 제거할 속성
        add?: Record<string, any>;          // 추가할 속성
        transform?: Record<string, (value: any) => any>;  // 값 변환
    };
    
    // 이벤트 매핑
    events?: {
        rename?: Record<string, string>;     // 이벤트명 변경
        wrap?: boolean;                      // CustomEvent로 래핑
        prefix?: string;                     // 이벤트 접두사
    };
    
    // 슬롯 매핑
    slots?: {
        rename?: Record<string, string>;     // 슬롯명 변경
        default?: string;                    // 기본 슬롯 이름
    };
    
    // 커스텀 변환 함수
    customTransform?: (element: HTMLElement, webComponent: HTMLElement) => void;
}

// 컴포넌트별 변환 맵
export type ComponentTransformMap = Map<string, ComponentTransform>;

// 브리지 레지스트리
export class BridgeRegistry {
    private static bridges = new Map<string, Bridge>();
    
    /**
     * 브리지 등록
     */
    static register(bridge: Bridge): void {
        this.bridges.set(bridge.getPrefix(), bridge);
        console.log(`[Bridge] Registered bridge for prefix: ${bridge.getPrefix()}`);
    }
    
    /**
     * 브리지 가져오기
     */
    static get(prefix: string): Bridge | undefined {
        return this.bridges.get(prefix);
    }
    
    /**
     * is 값으로 브리지 찾기
     */
    static findBridge(isValue: string): Bridge | undefined {
        const prefix = isValue.split('-')[0];
        return this.get(prefix);
    }
    
    /**
     * 모든 브리지 가져오기
     */
    static getAll(): Bridge[] {
        return Array.from(this.bridges.values());
    }
}

/**
 * 웹 컴포넌트 브리지 기반 클래스
 */
export abstract class Bridge {
    protected config: BridgeConfig;
    protected loaded: boolean = false;
    protected loadingPromise: Promise<void> | null = null;
    protected observedElements: WeakMap<HTMLElement, MutationObserver> = new WeakMap();
    protected observers: Set<MutationObserver> = new Set(); // Observer 추적용
    
    constructor(config: BridgeConfig) {
        this.config = config;
        
        // 자동 등록
        BridgeRegistry.register(this);
        
        // 로딩 전략에 따른 초기화
        if (config.loadStrategy === 'eager') {
            this.load();
        }
    }
    
    /**
     * 컴포넌트 접두사 가져오기
     */
    getPrefix(): string {
        return this.config.prefix;
    }
    
    /**
     * 라이브러리 로드
     */
    async load(): Promise<void> {
        if (this.loaded) return;
        
        if (this.loadingPromise) {
            return this.loadingPromise;
        }
        
        this.loadingPromise = this.performLoad();
        await this.loadingPromise;
        this.loaded = true;
        this.loadingPromise = null;
    }
    
    /**
     * 실제 로드 수행 (하위 클래스에서 구현)
     */
    protected abstract performLoad(): Promise<void>;
    
    /**
     * 요소를 웹 컴포넌트로 변환
     */
    async transform(element: HTMLElement): Promise<HTMLElement | null> {
        const isValue = element.getAttribute('is');
        if (!isValue || !isValue.startsWith(this.config.prefix + '-')) {
            return null;
        }
        
        // lazy 로딩
        if (this.config.loadStrategy === 'lazy' && !this.loaded) {
            await this.load();
        }
        
        // 웹 컴포넌트 생성
        const componentName = isValue;
        const webComponent = this.createElement(componentName);
        if (!webComponent) {
            console.warn(`[Bridge] Failed to create component: ${componentName}`);
            return null;
        }
        
        // 변환 규칙 가져오기
        const transform = this.getTransform(componentName);
        
        // 속성 복사
        this.copyAttributes(element, webComponent, transform);
        
        // 자식 노드 이동
        this.moveChildren(element, webComponent, transform);
        
        // 이벤트 설정
        this.setupEvents(element, webComponent, transform);
        
        // 커스텀 변환
        if (transform?.customTransform) {
            transform.customTransform(element, webComponent);
        }
        
        // DOM 교체
        element.parentNode?.replaceChild(webComponent, element);
        
        // 변화 감지 설정
        this.observeChanges(webComponent);
        
        return webComponent;
    }
    
    /**
     * 웹 컴포넌트 생성
     */
    protected createElement(componentName: string): HTMLElement | null {
        try {
            return document.createElement(componentName);
        } catch (error) {
            console.error(`[Bridge] Failed to create element: ${componentName}`, error);
            return null;
        }
    }
    
    /**
     * 변환 규칙 가져오기
     */
    protected getTransform(componentName: string): ComponentTransform | undefined {
        return this.config.transformations?.get(componentName);
    }
    
    /**
     * 속성 복사
     */
    protected copyAttributes(
        source: HTMLElement, 
        target: HTMLElement, 
        transform?: ComponentTransform
    ): void {
        const attrConfig = transform?.attributes;
        const removeAttrs = attrConfig?.remove || ['is'];
        const renameMap = attrConfig?.rename || {};
        const addAttrs = attrConfig?.add || {};
        const transformMap = attrConfig?.transform || {};
        
        // 기존 속성 복사
        Array.from(source.attributes).forEach(attr => {
            if (removeAttrs.includes(attr.name)) return;
            
            let name = renameMap[attr.name] || attr.name;
            let value: any = attr.value;
            
            // 값 변환
            if (transformMap[attr.name]) {
                value = transformMap[attr.name](value);
            }
            
            // boolean 속성 처리
            if (value === '' || value === 'true') {
                target.setAttribute(name, '');
            } else if (value === 'false') {
                // false는 속성 제거
            } else {
                target.setAttribute(name, value);
            }
        });
        
        // 추가 속성
        Object.entries(addAttrs).forEach(([name, value]) => {
            if (value !== undefined && value !== null) {
                target.setAttribute(name, String(value));
            }
        });
    }
    
    /**
     * 자식 노드 이동
     */
    protected moveChildren(
        source: HTMLElement, 
        target: HTMLElement, 
        transform?: ComponentTransform
    ): void {
        const slotConfig = transform?.slots;
        const renameMap = slotConfig?.rename || {};
        const defaultSlot = slotConfig?.default;
        
        // 슬롯이 있는 자식들 처리
        Array.from(source.children).forEach(child => {
            const slot = child.getAttribute('slot');
            if (slot && renameMap[slot]) {
                child.setAttribute('slot', renameMap[slot]);
            } else if (!slot && defaultSlot) {
                child.setAttribute('slot', defaultSlot);
            }
        });
        
        // 모든 자식 노드 이동
        while (source.firstChild) {
            target.appendChild(source.firstChild);
        }
    }
    
    /**
     * 이벤트 설정
     */
    protected setupEvents(
        source: HTMLElement, 
        target: HTMLElement, 
        transform?: ComponentTransform
    ): void {
        const eventConfig = transform?.events;
        const renameMap = eventConfig?.rename || {};
        const prefix = eventConfig?.prefix || '';
        const wrap = eventConfig?.wrap !== false;
        
        // 기존 이벤트 리스너 복사 (이벤트 위임으로 처리)
        const sourceListeners = (source as any).__eventListeners;
        if (sourceListeners) {
            Object.entries(sourceListeners).forEach(([eventType, listeners]) => {
                const newEventType = renameMap[eventType] || (prefix + eventType);
                
                (listeners as Function[]).forEach(listener => {
                    if (wrap) {
                        target.addEventListener(newEventType, (e: Event) => {
                            const customEvent = new CustomEvent(eventType, {
                                detail: (e as CustomEvent).detail || e,
                                bubbles: true,
                                composed: true
                            });
                            listener(customEvent);
                        });
                    } else {
                        target.addEventListener(newEventType, listener as EventListener);
                    }
                });
            });
        }
    }
    
    /**
     * 변화 감지 설정
     */
    protected observeChanges(element: HTMLElement): void {
        const observer = new MutationObserver((mutations) => {
            this.handleMutations(element, mutations);
        });
        
        observer.observe(element, {
            attributes: true,
            childList: true,
            subtree: true
        });
        
        this.observedElements.set(element, observer);
        this.observers.add(observer); // Set에도 추가
    }
    
    /**
     * 변화 처리
     */
    protected handleMutations(element: HTMLElement, mutations: MutationRecord[]): void {
        // 하위 클래스에서 구현
    }
    
    /**
     * 일괄 변환
     */
    async transformAll(container: HTMLElement = document.body): Promise<void> {
        const selector = `[is^="${this.config.prefix}-"]`;
        const elements = container.querySelectorAll(selector);
        
        const promises = Array.from(elements).map(el => 
            this.transform(el as HTMLElement)
        );
        
        await Promise.all(promises);
        
        console.log(`[Bridge] Transformed ${elements.length} elements with prefix: ${this.config.prefix}`);
    }
    
    /**
     * 자동 변환 시작
     */
    startAutoTransform(container: HTMLElement = document.body): void {
        // 초기 변환
        this.transformAll(container);
        
        // DOM 변화 감지
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        const isValue = element.getAttribute('is');
                        
                        if (isValue?.startsWith(this.config.prefix + '-')) {
                            this.transform(element);
                        }
                        
                        // 하위 요소도 검사
                        this.transformAll(element);
                    }
                });
            });
        });
        
        observer.observe(container, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * 정리
     */
    destroy(): void {
        // 모든 Observer 정리
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.observedElements = new WeakMap();
    }
}

/**
 * 브리지 유틸리티
 */
export class BridgeUtils {
    /**
     * 모든 is 속성 요소 변환
     */
    static async transformAll(container: HTMLElement = document.body): Promise<void> {
        const elements = container.querySelectorAll('[is*="-"]');
        
        for (const element of Array.from(elements)) {
            const isValue = element.getAttribute('is');
            if (!isValue) continue;
            
            const bridge = BridgeRegistry.findBridge(isValue);
            if (bridge) {
                await bridge.transform(element as HTMLElement);
            }
        }
    }
    
    /**
     * 자동 변환 시작
     */
    static startAutoTransform(container: HTMLElement = document.body): void {
        // 모든 브리지에 대해 자동 변환 시작
        BridgeRegistry.getAll().forEach(bridge => {
            bridge.startAutoTransform(container);
        });
    }
    
    /**
     * 특정 요소 변환
     */
    static async transformElement(element: HTMLElement): Promise<HTMLElement | null> {
        const isValue = element.getAttribute('is');
        if (!isValue) return null;
        
        const bridge = BridgeRegistry.findBridge(isValue);
        if (!bridge) return null;
        
        return bridge.transform(element);
    }
}