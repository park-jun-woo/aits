/**
 * Bridge.ts - 외부 웹 컴포넌트 브리지 시스템 (코어 인터페이스)
 * 프리셋 구현체는 제거하고 인터페이스만 유지
 */

// === 공개 인터페이스 (변경 없음) ===

export interface BridgeContext {
  replaceWith(tag: string, opts?: {
    attrs?: Record<string, string | boolean | number | null | undefined>
    events?: Record<string, EventListener>
    slots?: Node[] | string
  }): void
  copyAttrs(el: Element, allowlist?: string[]): Record<string, string>
  copyChildren(el: Element): Node[]
  forward(eventName: string): EventListener
}

export interface BridgePreset {
  name: string
  match(el: Element): boolean
  transform(el: Element, ctx: BridgeContext): void
  setup?(env: 'client'|'server'): Promise<void> | void
}

// === 레지스트리 (수정: 외부 프리셋 등록 지원) ===

class BridgeRegistry {
  private static presets: BridgePreset[] = []
  
  static register(preset: BridgePreset): void {
    // 중복 체크
    if (this.presets.find(p => p.name === preset.name)) {
      console.warn(`[Bridge] Preset '${preset.name}' already registered`)
      return
    }
    
    this.presets.push(preset)
    console.log(`[Bridge] Registered preset: ${preset.name}`)
  }
  
  static unregister(name: string): void {
    const index = this.presets.findIndex(p => p.name === name)
    if (index !== -1) {
      this.presets.splice(index, 1)
    }
  }
  
  static getAll(): BridgePreset[] {
    return [...this.presets]
  }
  
  static find(element: Element): BridgePreset | undefined {
    return this.presets.find(preset => preset.match(element))
  }
  
  static clear(): void {
    this.presets = []
  }
}

// === 공개 API ===

export function registerBridge(preset: BridgePreset): void {
  BridgeRegistry.register(preset)
}

export function unregisterBridge(name: string): void {
  BridgeRegistry.unregister(name)
}

export function getAllBridges(): BridgePreset[] {
  return BridgeRegistry.getAll()
}

export function findBridge(element: Element): BridgePreset | undefined {
  return BridgeRegistry.find(element)
}

// === 헬퍼 구현 ===

export function createBridgeContext(targetElement: Element): BridgeContext {
  return {
    replaceWith(tag: string, opts = {}) {
      const newEl = document.createElement(tag)
      
      // 속성 설정
      if (opts.attrs) {
        Object.entries(opts.attrs).forEach(([key, value]) => {
          if (value != null && value !== false) {
            newEl.setAttribute(key, String(value))
          }
        })
      }
      
      // 이벤트 설정
      if (opts.events) {
        Object.entries(opts.events).forEach(([event, handler]) => {
          newEl.addEventListener(event, handler)
        })
      }
      
      // 슬롯/자식 설정
      if (opts.slots) {
        if (typeof opts.slots === 'string') {
          newEl.innerHTML = opts.slots
        } else {
          opts.slots.forEach(node => newEl.appendChild(node))
        }
      }
      
      targetElement.replaceWith(newEl)
    },
    
    copyAttrs(el: Element, allowlist?: string[]) {
      const attrs: Record<string, string> = {}
      Array.from(el.attributes).forEach(attr => {
        if (!allowlist || allowlist.includes(attr.name)) {
          attrs[attr.name] = attr.value
        }
      })
      return attrs
    },
    
    copyChildren(el: Element) {
      return Array.from(el.childNodes)
    },
    
    forward(eventName: string) {
      return (e: Event) => {
        targetElement.dispatchEvent(new CustomEvent(eventName, {
          detail: e,
          bubbles: true,
          composed: true
        }))
      }
    }
  }
}

// 내장 프리셋 import 제거 - 이제 각 패키지에서 제공