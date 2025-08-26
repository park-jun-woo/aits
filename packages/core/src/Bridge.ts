/**
 * Bridge.ts - 외부 웹 컴포넌트 브리지 시스템 (코어)
 */

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

export interface BridgePreset {
  name: string;
  match(el: Element): boolean;
  transform(el: Element, ctx: BridgeContext): void;
  setup?(env: 'client' | 'server'): Promise<void> | void;
  destroy?(): void;
}

// === 레지스트리 ===

class BridgeRegistry {
  private static presets: BridgePreset[] = [];
  private static setupPromises: Map<string, Promise<void>> = new Map();
  
  static register(preset: BridgePreset): void {
    if (this.presets.find(p => p.name === preset.name)) {
      console.warn(`[Bridge] Preset '${preset.name}' already registered`);
      return;
    }
    
    this.presets.push(preset);
    console.log(`[Bridge] Registered preset: ${preset.name}`);
    
    // 자동 setup 실행 (client 환경에서만)
    if (typeof window !== 'undefined' && preset.setup) {
      this.setupPreset(preset);
    }
  }
  
  static unregister(name: string): void {
    const index = this.presets.findIndex(p => p.name === name);
    if (index !== -1) {
      const preset = this.presets[index];
      preset.destroy?.();
      this.presets.splice(index, 1);
      this.setupPromises.delete(name);
    }
  }
  
  static getAll(): BridgePreset[] {
    return [...this.presets];
  }
  
  static find(element: Element): BridgePreset | undefined {
    return this.presets.find(preset => preset.match(element));
  }
  
  static clear(): void {
    this.presets.forEach(preset => preset.destroy?.());
    this.presets = [];
    this.setupPromises.clear();
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
   * 특정 요소를 변환
   */
  static async transformElement(element: Element): Promise<Element | null> {
    const preset = BridgeRegistry.find(element);
    
    if (!preset) {
      return null;
    }
    
    // Setup 보장
    await BridgeRegistry.ensureSetup(preset);
    
    // 변환 실행
    const context = createBridgeContext(element);
    preset.transform(element, context);
    
    // 변환된 요소 반환 (replaceWith가 실행되었으므로 새 요소를 찾아야 함)
    return element.parentElement?.lastElementChild || null;
  }
  
  /**
   * 컨테이너 내의 모든 요소 변환
   */
  static async transformAll(container: Element = document.body): Promise<void> {
    const elements = container.querySelectorAll('[is]');
    
    for (const element of Array.from(elements)) {
      const preset = BridgeRegistry.find(element);
      if (preset) {
        await this.transformElement(element);
      }
    }
  }
  
  /**
   * 자동 변환 시작
   */
  static startAutoTransform(): void {
    if (this.isAutoTransforming) {
      return;
    }
    
    this.isAutoTransforming = true;
    
    // 초기 변환
    this.transformAll();
    
    // DOM 변경 감시
    this.observer = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // 요소 자체 확인
              if (element.hasAttribute('is')) {
                const preset = BridgeRegistry.find(element);
                if (preset) {
                  await this.transformElement(element);
                }
              }
              
              // 하위 요소들 확인
              const children = element.querySelectorAll('[is]');
              for (const child of Array.from(children)) {
                const preset = BridgeRegistry.find(child);
                if (preset) {
                  await this.transformElement(child);
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
    
    console.log('[Bridge] Auto-transform started');
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
    registered: string[];
    autoTransform: boolean;
    setupCompleted: string[];
  } {
    const presets = BridgeRegistry.getAll();
    return {
      registered: presets.map(p => p.name),
      autoTransform: this.isAutoTransforming,
      setupCompleted: presets.filter(p => p.setup).map(p => p.name)
    };
  }
}

// === 전역 노출 (디버깅용) ===

if (typeof window !== 'undefined') {
  (window as any).__AITS_BRIDGE__ = {
    registry: BridgeRegistry,
    utils: BridgeUtils,
    registerBridge,
    unregisterBridge,
    getAllBridges,
    findBridge,
    clearBridges,
    createBridgeContext,
    status: () => BridgeUtils.getStatus()
  };
}