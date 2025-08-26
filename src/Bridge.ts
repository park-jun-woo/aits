/**
 * Bridge.ts - 외부 웹 컴포넌트 브리지 시스템 (인터페이스만)
 */

// === 공개 인터페이스 ===
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

// === 레지스트리 ===
class BridgeRegistry {
  private static presets: BridgePreset[] = []
  
  static register(preset: BridgePreset): void {
    if (this.presets.find(p => p.name === preset.name)) {
      console.warn(`[Bridge] Preset '${preset.name}' already registered`)
      return
    }
    this.presets.push(preset)
  }
  
  static getAll(): BridgePreset[] {
    return [...this.presets]
  }
  
  static find(element: Element): BridgePreset | undefined {
    return this.presets.find(preset => preset.match(element))
  }
}

// === 공개 API ===
export function registerBridge(preset: BridgePreset): void {
  BridgeRegistry.register(preset)
}

export function getAllBridges(): BridgePreset[] {
  return BridgeRegistry.getAll()
}

export function findBridge(element: Element): BridgePreset | undefined {
  return BridgeRegistry.find(element)
}
