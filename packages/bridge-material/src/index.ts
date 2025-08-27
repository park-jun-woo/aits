import { registerBridge, BridgeUtils } from '@aits/core';
import type { BridgePreset, BridgeContext } from '@aits/core';
import { componentTransforms, defaultTransform } from './transforms';
import {
    showSnackbar,
    createDialog,
    createMenu,
    confirm,
    prompt,
    setTheme,
    applyDynamicColors,
    waitForComponent,
    waitForAllComponents
} from './helpers';

// 타입 export
export * from './types';

// Material preset을 여기서 직접 정의
let materialLoaded = false;
let basePath: string | null = null;

export const materialPreset: BridgePreset = {
    name: 'material',
    
    match(el: Element): boolean {
        const isAttr = el.getAttribute('is');
        return isAttr?.startsWith('md-') ?? false;
    },
    
    async setup(env: 'client' | 'server'): Promise<void> {
        if (env === 'server' || materialLoaded) return;
        
        console.log('[Material] Loading Material Design 3 Web Components...');
        
        // Material 3 토큰 CSS 변수 및 폰트
        const style = document.createElement('style');
        style.id = 'material-theme-tokens';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
            @import url('https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined');
            
            :root {
                /* Typography */
                --md-sys-typescale-body-medium-font: 'Roboto', sans-serif;
                
                /* Primary colors (Material You Purple) */
                --md-sys-color-primary: #6750a4;
                --md-sys-color-on-primary: #ffffff;
                --md-sys-color-primary-container: #eaddff;
                --md-sys-color-on-primary-container: #21005d;
                
                /* Error colors */
                --md-sys-color-error: #ba1a1a;
                --md-sys-color-on-error: #ffffff;
                
                /* Neutral colors */
                --md-sys-color-background: #fffbfe;
                --md-sys-color-on-background: #1c1b1f;
                --md-sys-color-surface: #fffbfe;
                --md-sys-color-on-surface: #1c1b1f;
                --md-sys-color-outline: #79747e;
            }
        `;
        document.head.appendChild(style);
        
        basePath = 'https://unpkg.com/@material/web@1.4.0/';
        (window as any).__MD_BASE_PATH__ = basePath;
        
        materialLoaded = true;
        console.log('[Material] Material Design 3 Web Components loaded successfully');
    },
    
    transform(el: Element, ctx: BridgeContext): void {
        const isValue = el.getAttribute('is');
        if (!isValue?.startsWith('md-')) return;
        
        const tagName = isValue;
        
        // Get component-specific transform rules
        const transform = componentTransforms[tagName] || defaultTransform;
        
        // Collect attributes
        const baseAttrs = ctx.copyAttrs(el);
        const customAttrs = transform.attributes?.(el) || {};
        const attrs = { ...baseAttrs, ...customAttrs };
        delete attrs.is; // Remove is attribute
        
        // Copy children
        const children = ctx.copyChildren(el);
        
        // Setup events
        const events = transform.events?.(ctx) || {};
        
        // Load component if needed
        if (typeof window !== 'undefined') {
            loadMaterialComponent(tagName).catch(console.error);
        }
        
        // Replace element
        ctx.replaceWith(tagName, {
            attrs,
            events,
            slots: children
        });
    },
    
    destroy(): void {
        document.getElementById('material-theme-tokens')?.remove();
        materialLoaded = false;
        basePath = null;
        console.log('[Material] Bridge destroyed');
    }
};

async function loadMaterialComponent(tagName: string): Promise<void> {
    if (customElements.get(tagName)) return;
    
    const basePath = (window as any).__MD_BASE_PATH__;
    if (!basePath) return;
    
    const componentMap: Record<string, string> = {
        'md-filled-button': 'button/filled-button.js',
        'md-outlined-button': 'button/outlined-button.js',
        'md-text-button': 'button/text-button.js',
        'md-checkbox': 'checkbox/checkbox.js',
        'md-dialog': 'dialog/dialog.js',
        'md-filled-text-field': 'textfield/filled-text-field.js',
        'md-outlined-text-field': 'textfield/outlined-text-field.js',
    };
    
    const componentPath = componentMap[tagName];
    if (!componentPath) return;
    
    try {
        await import(`${basePath}${componentPath}`);
        console.log(`[Material] Loaded component: ${tagName}`);
    } catch (error) {
        console.error(`[Material] Failed to load component ${tagName}:`, error);
    }
}

// 기본 export
export default materialPreset;

// 헬퍼 함수들 export
export {
    showSnackbar,
    createDialog,
    createMenu,
    confirm,
    prompt,
    setTheme,
    applyDynamicColors,
    waitForComponent,
    waitForAllComponents
};

// 설정 옵션
export interface MaterialConfig {
    theme?: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    autoRegister?: boolean;
    autoTransform?: boolean;
}

/**
 * Material Bridge 초기화
 */
export async function initMaterial(config: MaterialConfig = {}): Promise<void> {
    // 테마 설정
    if (config.theme) {
        setTheme(config.theme);
    }
    
    // Dynamic color 설정
    if (config.primaryColor) {
        await applyDynamicColors(config.primaryColor);
    }
    
    // 브리지 등록
    if (config.autoRegister !== false) {
        registerBridge(materialPreset);
    }
    
    // 자동 변환 시작
    if (config.autoTransform) {
        BridgeUtils.startAutoTransform();
    }
    
    console.log('[Material] Bridge initialized');
}

// DOM 준비 시 자동 초기화
if (typeof window !== 'undefined') {
    // 전역 네임스페이스 등록
    (window as any).MaterialBridge = {
        init: initMaterial,
        preset: materialPreset,
        showSnackbar,
        createDialog,
        createMenu,
        confirm,
        prompt,
        setTheme,
        applyDynamicColors,
        waitForComponent,
        waitForAllComponents
    };
    
    // data-auto-init 속성이 있으면 자동 초기화
    document.addEventListener('DOMContentLoaded', () => {
        const script = document.querySelector('script[data-material-auto-init]');
        if (script) {
            const config: MaterialConfig = {
                autoRegister: true,
                autoTransform: true,
                theme: script.getAttribute('data-theme') as any || 'auto',
                primaryColor: script.getAttribute('data-primary-color') || undefined
            };
            initMaterial(config);
        }
    });
}