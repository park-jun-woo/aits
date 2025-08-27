/**
 * =================================================================
 * Bridge.ts - 외부 웹 컴포넌트 브리지 시스템 (네이티브 지원 통합 버전)
 * =================================================================
 * @description
 * - Customized Built-in Elements 네이티브 지원 감지
 * - 지원 시 customElements.define() 사용, 미지원 시 브리지 폴백
 * - 점진적 향상을 통한 표준 준수
 * @author Aits Framework AI
 * @version 2.0.0
 */

// === 네이티브 지원 감지 ===

/**
 * Customized Built-in Elements (is 속성) 지원 여부를 감지
 * Safari는 아직 미지원, Chrome/Firefox는 지원
 */
const SUPPORTS_CUSTOMIZED_BUILTIN = (() => {
    // 서버 환경에서는 항상 false
    if (typeof window === 'undefined' || !window.customElements) {
        return false;
    }
    
    try {
        // HTMLButtonElement를 확장하는 테스트 클래스
        class TestButton extends HTMLButtonElement {}
        
        // define 시도 (실패하면 catch로)
        window.customElements.define(
            'test-builtin-support-check',
            TestButton,
            { extends: 'button' }
        );
        
        // 정의된 것 제거 (실제로는 제거 불가능하지만 덮어쓰기 시도)
        return true;
    } catch (e) {
        // Safari 등에서 에러 발생
        return false;
    }
})();

// === 공개 인터페이스 ===

export interface BridgeContext {
    replaceWith(tag: string, opts?: {
        attrs?: Record<string, string | boolean | number | null | undefined>
        events?: Record<string, EventListener>
        slots?: Node[] | string
    }): void;
    copyAttrs(el: Element, allowlist?: string[]): Record<string, string>;
    copyChildren(el: Element): Node[];
    forward(eventName: string): EventListener;
}

/**
 * 확장된 BridgePreset 인터페이스
 * - componentClass: 네이티브 웹 컴포넌트 클래스 정의
 * - extends: 확장할 네이티브 요소
 */
export interface BridgePreset {
    name: string;
    match(el: Element): boolean;
    
    // 브리지 방식 변환 (폴백)
    transform?(el: Element, ctx: BridgeContext): void;
    
    // 네이티브 웹 컴포넌트 정의
    componentClass?: typeof HTMLElement;
    extends?: { [tagName: string]: string }; // { 'sl-button': 'button' }
    
    // 초기화 및 정리
    setup?(env: 'client' | 'server'): Promise<void> | void;
    destroy?(): void;
}

// === 웹 컴포넌트 클래스 팩토리 ===

/**
 * BridgePreset을 기반으로 네이티브 웹 컴포넌트 클래스 생성
 */
function createWebComponentClass(
    preset: BridgePreset,
    baseElement: typeof HTMLElement
): typeof HTMLElement {
    return class extends baseElement {
        private _bridgeContext?: BridgeContext;
        
        constructor() {
            super();
            this._bridgeContext = createBridgeContext(this);
        }
        
        connectedCallback() {
            // 브리지의 transform 로직을 재사용
            if (preset.transform && this._bridgeContext) {
                // 네이티브 환경에서는 replaceWith 대신 직접 조작
                const originalReplaceWith = this._bridgeContext.replaceWith;
                this._bridgeContext.replaceWith = (tag, opts) => {
                    // 속성 적용
                    if (opts?.attrs) {
                        Object.entries(opts.attrs).forEach(([key, value]) => {
                            if (value != null && value !== false) {
                                this.setAttribute(key, String(value));
                            }
                        });
                    }
                    // 이벤트 적용
                    if (opts?.events) {
                        Object.entries(opts.events).forEach(([event, handler]) => {
                            this.addEventListener(event, handler);
                        });
                    }
                    // 슬롯은 Shadow DOM이 아닌 경우 직접 삽입
                    if (opts?.slots) {
                        if (typeof opts.slots === 'string') {
                            this.innerHTML = opts.slots;
                        } else {
                            opts.slots.forEach(node => {
                                this.appendChild(node.cloneNode(true));
                            });
                        }
                    }
                };
                
                // transform 실행 (단, DOM 교체는 하지 않음)
                preset.transform(this, this._bridgeContext);
            }
        }
        
        disconnectedCallback() {
            // 정리 작업
            if (preset.destroy) {
                preset.destroy();
            }
        }
    };
}

// === 레지스트리 ===

class BridgeRegistry {
    private static presets: BridgePreset[] = [];
    private static setupPromises: Map<string, Promise<void>> = new Map();
    private static nativeComponents: Set<string> = new Set();  // 네이티브로 등록된 컴포넌트
    private static polyfillComponents: Set<string> = new Set(); // 폴백으로 처리 중인 컴포넌트
    
    static register(preset: BridgePreset): void {
        if (this.presets.find(p => p.name === preset.name)) {
            console.warn(`[Bridge] Preset '${preset.name}' already registered`);
            return;
        }
        
        this.presets.push(preset);
        console.log(`[Bridge] Registered preset: ${preset.name} (Native support: ${SUPPORTS_CUSTOMIZED_BUILTIN ? 'YES' : 'NO'})`);
        
        // 클라이언트 환경에서만 처리
        if (typeof window !== 'undefined') {
            // setup 실행
            this.setupPreset(preset);
            
            // 네이티브 지원 시 웹 컴포넌트로 등록
            if (SUPPORTS_CUSTOMIZED_BUILTIN && preset.extends) {
                this.registerAsNativeComponents(preset);
            }
        }
    }
    
    /**
     * 프리셋을 네이티브 웹 컴포넌트로 등록
     */
    private static registerAsNativeComponents(preset: BridgePreset): void {
        if (!preset.extends) return;
        
        Object.entries(preset.extends).forEach(([componentName, extendsTag]) => {
            // 이미 등록됐는지 확인
            if (customElements.get(componentName)) {
                console.warn(`[Bridge] Component '${componentName}' already defined`);
                return;
            }
            
            try {
                // 기본 요소 클래스 결정
                let BaseElement: typeof HTMLElement;
                switch (extendsTag) {
                    case 'button': BaseElement = HTMLButtonElement; break;
                    case 'input': BaseElement = HTMLInputElement; break;
                    case 'div': BaseElement = HTMLDivElement; break;
                    case 'span': BaseElement = HTMLSpanElement; break;
                    case 'section': BaseElement = HTMLElement; break;
                    case 'nav': BaseElement = HTMLElement; break;
                    case 'article': BaseElement = HTMLElement; break;
                    case 'select': BaseElement = HTMLSelectElement; break;
                    case 'textarea': BaseElement = HTMLTextAreaElement; break;
                    case 'form': BaseElement = HTMLFormElement; break;
                    case 'label': BaseElement = HTMLLabelElement; break;
                    case 'a': BaseElement = HTMLAnchorElement; break;
                    case 'ul': BaseElement = HTMLUListElement; break;
                    case 'ol': BaseElement = HTMLOListElement; break;
                    case 'li': BaseElement = HTMLLIElement; break;
                    case 'table': BaseElement = HTMLTableElement; break;
                    case 'canvas': BaseElement = HTMLCanvasElement; break;
                    default: BaseElement = HTMLElement;
                }
                
                // 웹 컴포넌트 클래스 생성
                const ComponentClass = preset.componentClass || 
                                       createWebComponentClass(preset, BaseElement);
                
                // customElements.define() 호출
                customElements.define(componentName, ComponentClass, {
                    extends: extendsTag
                });
                
                this.nativeComponents.add(componentName);
                console.log(`[Bridge] Registered native component: <${extendsTag} is="${componentName}">`);
                
            } catch (error) {
                console.error(`[Bridge] Failed to register native component '${componentName}':`, error);
                // 실패 시 폴백으로 처리되도록 표시
                this.polyfillComponents.add(componentName);
            }
        });
    }
    
    static unregister(name: string): void {
        const index = this.presets.findIndex(p => p.name === name);
        if (index !== -1) {
            const preset = this.presets[index];
            preset.destroy?.();
            this.presets.splice(index, 1);
            this.setupPromises.delete(name);
            
            // 네이티브 컴포넌트는 unregister 불가능 (브라우저 제약)
            if (preset.extends) {
                Object.keys(preset.extends).forEach(componentName => {
                    if (this.nativeComponents.has(componentName)) {
                        console.warn(`[Bridge] Native component '${componentName}' cannot be unregistered (browser limitation)`);
                    }
                });
            }
        }
    }
    
    static getAll(): BridgePreset[] {
        return [...this.presets];
    }
    
    static find(element: Element): BridgePreset | undefined {
        return this.presets.find(preset => preset.match(element));
    }
    
    static isNativeComponent(componentName: string): boolean {
        return this.nativeComponents.has(componentName);
    }
    
    static isPolyfillComponent(componentName: string): boolean {
        return this.polyfillComponents.has(componentName) || 
               (!SUPPORTS_CUSTOMIZED_BUILTIN && !this.nativeComponents.has(componentName));
    }
    
    static clear(): void {
        this.presets.forEach(preset => preset.destroy?.());
        this.presets = [];
        this.setupPromises.clear();
        this.nativeComponents.clear();
        this.polyfillComponents.clear();
    }
    
    private static async setupPreset(preset: BridgePreset): Promise<void> {
        if (this.setupPromises.has(preset.name)) {
            return this.setupPromises.get(preset.name);
        }
        
        const setupPromise = (async () => {
            try {
                await preset.setup?.('client');
            } catch (error) {
                console.error(`[Bridge] Failed to setup preset '${preset.name}':`, error);
            }
        })();
        
        this.setupPromises.set(preset.name, setupPromise);
        return setupPromise;
    }
    
    static async ensureSetup(preset: BridgePreset): Promise<void> {
        if (preset.setup && typeof window !== 'undefined') {
            return this.setupPreset(preset);
        }
    }
}

// === 공개 API ===

export function registerBridge(preset: BridgePreset): void {
    BridgeRegistry.register(preset);
}

export function unregisterBridge(name: string): void {
    BridgeRegistry.unregister(name);
}

export function getAllBridges(): BridgePreset[] {
    return BridgeRegistry.getAll();
}

export function findBridge(element: Element): BridgePreset | undefined {
    return BridgeRegistry.find(element);
}

export function clearBridges(): void {
    BridgeRegistry.clear();
}

export function isNativeWebComponent(componentName: string): boolean {
    return BridgeRegistry.isNativeComponent(componentName);
}

export function isPolyfillWebComponent(componentName: string): boolean {
    return BridgeRegistry.isPolyfillComponent(componentName);
}

// === 헬퍼 함수 ===

export function createBridgeContext(targetElement: Element): BridgeContext {
    return {
        replaceWith(tag: string, opts = {}) {
            const newEl = document.createElement(tag);
            
            // 속성 설정
            if (opts.attrs) {
                Object.entries(opts.attrs).forEach(([key, value]) => {
                    if (value != null && value !== false) {
                        if (key === 'className' || key === 'class') {
                            newEl.className = String(value);
                        } else if (key === 'style' && typeof value === 'object') {
                            Object.assign(newEl.style, value);
                        } else if (key in newEl) {
                            (newEl as any)[key] = value;
                        } else {
                            newEl.setAttribute(key, String(value));
                        }
                    }
                });
            }
            
            // 이벤트 설정
            if (opts.events) {
                Object.entries(opts.events).forEach(([event, handler]) => {
                    newEl.addEventListener(event, handler);
                });
            }
            
            // 슬롯/자식 설정
            if (opts.slots) {
                if (typeof opts.slots === 'string') {
                    newEl.innerHTML = opts.slots;
                } else {
                    opts.slots.forEach(node => {
                        newEl.appendChild(node.cloneNode(true));
                    });
                }
            }
            
            // DOM에서 교체
            targetElement.replaceWith(newEl);
        },
        
        copyAttrs(el: Element, allowlist?: string[]) {
            const attrs: Record<string, string> = {};
            Array.from(el.attributes).forEach(attr => {
                if (!allowlist || allowlist.includes(attr.name)) {
                    attrs[attr.name] = attr.value;
                }
            });
            return attrs;
        },
        
        copyChildren(el: Element) {
            return Array.from(el.childNodes);
        },
        
        forward(eventName: string) {
            return (e: Event) => {
                targetElement.dispatchEvent(new CustomEvent(eventName, {
                    detail: e,
                    bubbles: true,
                    composed: true
                }));
            };
        }
    };
}

// === Bridge 유틸리티 ===

export class BridgeUtils {
    private static observer: MutationObserver | null = null;
    private static isAutoTransforming = false;
    
    /**
     * 특정 요소를 변환 (네이티브 지원 시 건너뜀)
     */
    static async transformElement(element: Element): Promise<Element | null> {
        const isValue = element.getAttribute('is');
        if (!isValue) return null;
        
        // 네이티브로 등록된 컴포넌트는 브라우저가 자동 처리
        if (SUPPORTS_CUSTOMIZED_BUILTIN && BridgeRegistry.isNativeComponent(isValue)) {
            console.log(`[Bridge] Skipping transform for native component: ${isValue}`);
            return element;
        }
        
        // 폴백 모드: 기존 transform 방식
        const preset = BridgeRegistry.find(element);
        
        if (!preset || !preset.transform) {
            return null;
        }
        
        await BridgeRegistry.ensureSetup(preset);
        
        const context = createBridgeContext(element);
        preset.transform(element, context);
        
        return element.parentElement?.lastElementChild || null;
    }
    
    /**
     * 컨테이너 내의 모든 요소 변환 (네이티브 컴포넌트는 자동 스킵)
     */
    static async transformAll(container: Element = document.body): Promise<void> {
        const elements = container.querySelectorAll('[is]');
        
        for (const element of Array.from(elements)) {
            const isValue = element.getAttribute('is');
            
            // 네이티브 컴포넌트는 건너뛰기
            if (isValue && !BridgeRegistry.isNativeComponent(isValue)) {
                const preset = BridgeRegistry.find(element);
                if (preset && preset.transform) {
                    await this.transformElement(element);
                }
            }
        }
    }
    
    /**
     * 자동 변환 시작 (폴백 컴포넌트만 감시)
     */
    static startAutoTransform(): void {
        if (this.isAutoTransforming) {
            return;
        }
        
        this.isAutoTransforming = true;
        
        // 초기 변환 (폴백 컴포넌트만)
        this.transformAll();
        
        // DOM 변경 감시 (네이티브는 브라우저가 처리)
        this.observer = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of Array.from(mutation.addedNodes)) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            const isValue = element.getAttribute('is');
                            
                            // 폴백 컴포넌트만 변환
                            if (isValue && !BridgeRegistry.isNativeComponent(isValue)) {
                                const preset = BridgeRegistry.find(element);
                                if (preset && preset.transform) {
                                    await this.transformElement(element);
                                }
                            }
                            
                            // 하위 요소들도 확인
                            const children = element.querySelectorAll('[is]');
                            for (const child of Array.from(children)) {
                                const childIsValue = child.getAttribute('is');
                                if (childIsValue && !BridgeRegistry.isNativeComponent(childIsValue)) {
                                    const preset = BridgeRegistry.find(child);
                                    if (preset && preset.transform) {
                                        await this.transformElement(child);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        const mode = SUPPORTS_CUSTOMIZED_BUILTIN ? 'Hybrid (Native + Polyfill)' : 'Polyfill Only';
        console.log(`[Bridge] Auto-transform started in ${mode} mode`);
    }
    
    /**
     * 자동 변환 중지
     */
    static stopAutoTransform(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        this.isAutoTransforming = false;
        console.log('[Bridge] Auto-transform stopped');
    }
    
    /**
     * 특정 속성값을 가진 요소들 찾기
     */
    static findElementsByIs(value: string, container: Element = document.body): Element[] {
        return Array.from(container.querySelectorAll(`[is="${value}"]`));
    }
    
    /**
     * 특정 프리셋과 매칭되는 요소들 찾기
     */
    static findElementsByPreset(presetName: string, container: Element = document.body): Element[] {
        const preset = BridgeRegistry.getAll().find(p => p.name === presetName);
        if (!preset) {
            return [];
        }
        
        const elements: Element[] = [];
        const allWithIs = container.querySelectorAll('[is]');
        
        for (const element of Array.from(allWithIs)) {
            if (preset.match(element)) {
                elements.push(element);
            }
        }
        
        return elements;
    }
    
    /**
     * 브리지 상태 확인
     */
    static getStatus(): {
        mode: string;
        supportsNative: boolean;
        registered: string[];
        nativeComponents: string[];
        polyfillComponents: string[];
        autoTransform: boolean;
    } {
        const presets = BridgeRegistry.getAll();
        return {
            mode: SUPPORTS_CUSTOMIZED_BUILTIN ? 'hybrid' : 'polyfill',
            supportsNative: SUPPORTS_CUSTOMIZED_BUILTIN,
            registered: presets.map(p => p.name),
            nativeComponents: Array.from((BridgeRegistry as any).nativeComponents || []),
            polyfillComponents: Array.from((BridgeRegistry as any).polyfillComponents || []),
            autoTransform: this.isAutoTransforming
        };
    }
}

// === 전역 노출 (디버깅용) ===

if (typeof window !== 'undefined') {
    (window as any).__AITS_BRIDGE__ = {
        SUPPORTS_NATIVE: SUPPORTS_CUSTOMIZED_BUILTIN,
        registry: BridgeRegistry,
        utils: BridgeUtils,
        registerBridge,
        unregisterBridge,
        getAllBridges,
        findBridge,
        clearBridges,
        isNativeWebComponent,
        isPolyfillWebComponent,
        createBridgeContext,
        status: () => BridgeUtils.getStatus()
    };
    
    console.log(`[Bridge] System initialized - Native Customized Built-in Elements: ${SUPPORTS_CUSTOMIZED_BUILTIN ? 'SUPPORTED ✓' : 'NOT SUPPORTED (using polyfill)'}`);
}