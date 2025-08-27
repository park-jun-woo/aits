import type { BridgePreset, BridgeContext } from '@aits/core';
import { componentTransforms, defaultTransform } from './transforms';

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
                --md-sys-typescale-body-large-font: 'Roboto', sans-serif;
                --md-sys-typescale-label-large-font: 'Roboto', sans-serif;
                --md-sys-typescale-title-large-font: 'Roboto', sans-serif;
                
                /* Primary colors (Material You Purple) */
                --md-sys-color-primary: #6750a4;
                --md-sys-color-on-primary: #ffffff;
                --md-sys-color-primary-container: #eaddff;
                --md-sys-color-on-primary-container: #21005d;
                
                /* Secondary colors */
                --md-sys-color-secondary: #625b71;
                --md-sys-color-on-secondary: #ffffff;
                --md-sys-color-secondary-container: #e8def8;
                --md-sys-color-on-secondary-container: #1d192b;
                
                /* Tertiary colors */
                --md-sys-color-tertiary: #7d5260;
                --md-sys-color-on-tertiary: #ffffff;
                --md-sys-color-tertiary-container: #ffd8e4;
                --md-sys-color-on-tertiary-container: #31111d;
                
                /* Error colors */
                --md-sys-color-error: #ba1a1a;
                --md-sys-color-on-error: #ffffff;
                --md-sys-color-error-container: #ffdad6;
                --md-sys-color-on-error-container: #410002;
                
                /* Neutral colors */
                --md-sys-color-background: #fffbfe;
                --md-sys-color-on-background: #1c1b1f;
                --md-sys-color-surface: #fffbfe;
                --md-sys-color-on-surface: #1c1b1f;
                --md-sys-color-surface-variant: #e7e0ec;
                --md-sys-color-on-surface-variant: #49454f;
                --md-sys-color-outline: #79747e;
                --md-sys-color-outline-variant: #cac4d0;
                
                /* State layers */
                --md-sys-state-hover-opacity: 0.08;
                --md-sys-state-focus-opacity: 0.12;
                --md-sys-state-pressed-opacity: 0.12;
                --md-sys-state-dragged-opacity: 0.16;
                
                /* Elevation */
                --md-sys-elevation-level0: 0px;
                --md-sys-elevation-level1: 1px;
                --md-sys-elevation-level2: 3px;
                --md-sys-elevation-level3: 6px;
                --md-sys-elevation-level4: 8px;
                --md-sys-elevation-level5: 12px;
                
                /* Motion */
                --md-sys-motion-duration-short1: 50ms;
                --md-sys-motion-duration-short2: 100ms;
                --md-sys-motion-duration-short3: 150ms;
                --md-sys-motion-duration-short4: 200ms;
                --md-sys-motion-duration-medium1: 250ms;
                --md-sys-motion-duration-medium2: 300ms;
                --md-sys-motion-duration-medium3: 350ms;
                --md-sys-motion-duration-medium4: 400ms;
                --md-sys-motion-duration-long1: 450ms;
                --md-sys-motion-duration-long2: 500ms;
                --md-sys-motion-duration-long3: 550ms;
                --md-sys-motion-duration-long4: 600ms;
                --md-sys-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);
                --md-sys-motion-easing-standard-decelerate: cubic-bezier(0, 0, 0, 1);
                --md-sys-motion-easing-standard-accelerate: cubic-bezier(0.3, 0, 1, 1);
                --md-sys-motion-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);
                --md-sys-motion-easing-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
                --md-sys-motion-easing-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
                
                /* Shape */
                --md-sys-shape-corner-none: 0px;
                --md-sys-shape-corner-extra-small: 4px;
                --md-sys-shape-corner-small: 8px;
                --md-sys-shape-corner-medium: 12px;
                --md-sys-shape-corner-large: 16px;
                --md-sys-shape-corner-extra-large: 28px;
                --md-sys-shape-corner-full: 9999px;
            }
            
            /* Dark theme */
            @media (prefers-color-scheme: dark) {
                :root {
                    --md-sys-color-primary: #d0bcff;
                    --md-sys-color-on-primary: #381e72;
                    --md-sys-color-primary-container: #4f378b;
                    --md-sys-color-on-primary-container: #eaddff;
                    
                    --md-sys-color-secondary: #ccc2dc;
                    --md-sys-color-on-secondary: #332d41;
                    --md-sys-color-secondary-container: #4a4458;
                    --md-sys-color-on-secondary-container: #e8def8;
                    
                    --md-sys-color-tertiary: #efb8c8;
                    --md-sys-color-on-tertiary: #492532;
                    --md-sys-color-tertiary-container: #633b48;
                    --md-sys-color-on-tertiary-container: #ffd8e4;
                    
                    --md-sys-color-error: #ffb4ab;
                    --md-sys-color-on-error: #690005;
                    --md-sys-color-error-container: #93000a;
                    --md-sys-color-on-error-container: #ffdad6;
                    
                    --md-sys-color-background: #1c1b1f;
                    --md-sys-color-on-background: #e6e1e5;
                    --md-sys-color-surface: #1c1b1f;
                    --md-sys-color-on-surface: #e6e1e5;
                    --md-sys-color-surface-variant: #49454f;
                    --md-sys-color-on-surface-variant: #cac4d0;
                    --md-sys-color-outline: #938f99;
                    --md-sys-color-outline-variant: #49454f;
                    
                    --md-sys-color-inverse-surface: #e6e1e5;
                    --md-sys-color-inverse-on-surface: #313033;
                    --md-sys-color-inverse-primary: #6750a4;
                }
            }
            
            /* Explicit theme classes */
            .md-theme-light {
                /* Light theme values (same as default) */
            }
            
            .md-theme-dark {
                /* Dark theme values */
                --md-sys-color-primary: #d0bcff;
                --md-sys-color-on-primary: #381e72;
                --md-sys-color-background: #1c1b1f;
                --md-sys-color-on-background: #e6e1e5;
                --md-sys-color-surface: #1c1b1f;
                --md-sys-color-on-surface: #e6e1e5;
            }
            
            /* Material icon font setup */
            .material-symbols-outlined {
                font-family: 'Material Symbols Outlined';
                font-weight: normal;
                font-style: normal;
                font-size: 24px;
                line-height: 1;
                letter-spacing: normal;
                text-transform: none;
                display: inline-block;
                white-space: nowrap;
                word-wrap: normal;
                direction: ltr;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
                font-feature-settings: 'liga';
            }
        `;
        document.head.appendChild(style);
        
        // Material Web Components loader
        // Using dynamic imports for individual components as needed
        basePath = 'https://unpkg.com/@material/web@1.4.0/';
        
        // Store basePath globally for dynamic loading
        (window as any).__MD_BASE_PATH__ = basePath;
        
        // Load core Material components
        await loadCoreComponents();
        
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
        
        // Handle slots if defined
        let slots = children;
        if (transform.slots) {
            const slotNodes = transform.slots(el);
            if (slotNodes) {
                slots = Object.values(slotNodes).flat();
            }
        }
        
        // Load component if needed
        if (typeof window !== 'undefined') {
            loadMaterialComponent(tagName).catch(console.error);
        }
        
        // Replace element
        ctx.replaceWith(tagName, {
            attrs,
            events,
            slots
        });
    },
    
    destroy(): void {
        // Remove added styles
        document.getElementById('material-theme-tokens')?.remove();
        
        materialLoaded = false;
        basePath = null;
        
        console.log('[Material] Bridge destroyed');
    }
};

/**
 * Load core Material components
 */
async function loadCoreComponents(): Promise<void> {
    // Core components that are commonly used
    const coreComponents = [
        'button/filled-button.js',
        'button/outlined-button.js',
        'button/text-button.js',
        'checkbox/checkbox.js',
        'dialog/dialog.js',
        'textfield/filled-text-field.js',
        'textfield/outlined-text-field.js'
    ];
    
    const basePath = (window as any).__MD_BASE_PATH__;
    
    // Load components in parallel
    await Promise.all(coreComponents.map(async (path) => {
        try {
            await import(`${basePath}${path}`);
        } catch (error) {
            console.warn(`[Material] Failed to load ${path}:`, error);
        }
    }));
}

/**
 * Dynamically load a specific Material component
 */
async function loadMaterialComponent(tagName: string): Promise<void> {
    // Check if already defined
    if (customElements.get(tagName)) {
        return;
    }
    
    const basePath = (window as any).__MD_BASE_PATH__;
    if (!basePath) {
        console.warn('[Material] Base path not set');
        return;
    }
    
    // Component path mapping
    const componentMap: Record<string, string> = {
        // Buttons
        'md-elevated-button': 'button/elevated-button.js',
        'md-filled-button': 'button/filled-button.js',
        'md-filled-tonal-button': 'button/filled-tonal-button.js',
        'md-outlined-button': 'button/outlined-button.js',
        'md-text-button': 'button/text-button.js',
        
        // Icon buttons
        'md-icon-button': 'iconbutton/icon-button.js',
        'md-filled-icon-button': 'iconbutton/filled-icon-button.js',
        'md-filled-tonal-icon-button': 'iconbutton/filled-tonal-icon-button.js',
        'md-outlined-icon-button': 'iconbutton/outlined-icon-button.js',
        
        // Form controls
        'md-checkbox': 'checkbox/checkbox.js',
        'md-switch': 'switch/switch.js',
        'md-radio': 'radio/radio.js',
        
        // Text fields
        'md-filled-text-field': 'textfield/filled-text-field.js',
        'md-outlined-text-field': 'textfield/outlined-text-field.js',
        
        // Select
        'md-filled-select': 'select/filled-select.js',
        'md-outlined-select': 'select/outlined-select.js',
        'md-select-option': 'select/select-option.js',
        
        // Dialog and menu
        'md-dialog': 'dialog/dialog.js',
        'md-menu': 'menu/menu.js',
        'md-menu-item': 'menu/menu-item.js',
        'md-sub-menu': 'menu/sub-menu.js',
        
        // Chips
        'md-chip-set': 'chips/chip-set.js',
        'md-assist-chip': 'chips/assist-chip.js',
        'md-filter-chip': 'chips/filter-chip.js',
        'md-input-chip': 'chips/input-chip.js',
        'md-suggestion-chip': 'chips/suggestion-chip.js',
        
        // Tabs
        'md-tabs': 'tabs/tabs.js',
        'md-primary-tab': 'tabs/primary-tab.js',
        'md-secondary-tab': 'tabs/secondary-tab.js',
        
        // FAB
        'md-fab': 'fab/fab.js',
        'md-branded-fab': 'fab/branded-fab.js',
        
        // Slider
        'md-slider': 'slider/slider.js',
        
        // Progress indicators
        'md-linear-progress': 'progress/linear-progress.js',
        'md-circular-progress': 'progress/circular-progress.js',
        
        // List
        'md-list': 'list/list.js',
        'md-list-item': 'list/list-item.js',
        
        // Divider
        'md-divider': 'divider/divider.js',
        
        // Ripple and elevation
        'md-ripple': 'ripple/ripple.js',
        'md-elevation': 'elevation/elevation.js',
        
        // Icon
        'md-icon': 'icon/icon.js'
    };
    
    const componentPath = componentMap[tagName];
    if (!componentPath) {
        console.warn(`[Material] Unknown component: ${tagName}`);
        return;
    }
    
    try {
        await import(`${basePath}${componentPath}`);
        console.log(`[Material] Loaded component: ${tagName}`);
    } catch (error) {
        console.error(`[Material] Failed to load component ${tagName}:`, error);
    }
}