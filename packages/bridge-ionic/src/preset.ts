import type { BridgePreset, BridgeContext } from '@aits/core';
import { componentTransforms, defaultTransform } from './transforms';

let ionicLoaded = false;

export const ionicPreset: BridgePreset = {
    name: 'ionic',
    
    match(el: Element): boolean {
        const isAttr = el.getAttribute('is');
        return isAttr?.startsWith('ion-') ?? false;
    },
    
    async setup(env: 'client' | 'server'): Promise<void> {
        if (env === 'server' || ionicLoaded) return;
        
        console.log('[Ionic] Loading Ionic Framework...');
        
        // Ionic CSS
        const ionicCSS = document.createElement('link');
        ionicCSS.rel = 'stylesheet';
        ionicCSS.href = 'https://cdn.jsdelivr.net/npm/@ionic/core@7.8.0/css/ionic.bundle.css';
        ionicCSS.id = 'ionic-css';
        document.head.appendChild(ionicCSS);
        
        // Ionic Core (ES Modules)
        const ionicScript = document.createElement('script');
        ionicScript.type = 'module';
        ionicScript.id = 'ionic-core';
        
        // Inline script to initialize Ionic
        ionicScript.innerHTML = `
            import { initialize } from 'https://cdn.jsdelivr.net/npm/@ionic/core@7.8.0/dist/ionic/index.esm.js';
            import { defineCustomElements } from 'https://cdn.jsdelivr.net/npm/@ionic/core@7.8.0/loader/index.es2017.js';
            
            // Initialize Ionic
            initialize();
            
            // Define custom elements
            defineCustomElements(window);
            
            // Store in window for access
            window.__IONIC_INITIALIZED__ = true;
        `;
        
        document.head.appendChild(ionicScript);
        
        // Wait for initialization
        await new Promise<void>((resolve) => {
            const checkInitialized = () => {
                if ((window as any).__IONIC_INITIALIZED__) {
                    resolve();
                } else {
                    setTimeout(checkInitialized, 50);
                }
            };
            checkInitialized();
        });
        
        // Custom styles for better integration
        const customStyles = document.createElement('style');
        customStyles.id = 'ionic-custom-styles';
        customStyles.textContent = `
            /* Custom Ionic styles for AITS integration */
            :root {
                --ion-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            
            /* Fix for mode attribute */
            html[mode="ios"] {
                --ion-default-font: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Roboto", sans-serif;
            }
            
            html[mode="md"] {
                --ion-default-font: "Roboto", "Helvetica Neue", sans-serif;
            }
            
            /* Safe area adjustments */
            ion-content {
                --padding-top: var(--ion-safe-area-top);
                --padding-bottom: var(--ion-safe-area-bottom);
                --padding-start: var(--ion-safe-area-left);
                --padding-end: var(--ion-safe-area-right);
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                body {
                    --ion-background-color: #1e1e1e;
                    --ion-background-color-rgb: 30, 30, 30;
                    --ion-text-color: #ffffff;
                    --ion-text-color-rgb: 255, 255, 255;
                    --ion-color-step-50: #0d0d0d;
                    --ion-color-step-100: #1a1a1a;
                    --ion-color-step-150: #262626;
                    --ion-color-step-200: #333333;
                    --ion-color-step-250: #404040;
                    --ion-color-step-300: #4d4d4d;
                    --ion-color-step-350: #595959;
                    --ion-color-step-400: #666666;
                    --ion-color-step-450: #737373;
                    --ion-color-step-500: #808080;
                    --ion-color-step-550: #8c8c8c;
                    --ion-color-step-600: #999999;
                    --ion-color-step-650: #a6a6a6;
                    --ion-color-step-700: #b3b3b3;
                    --ion-color-step-750: #bfbfbf;
                    --ion-color-step-800: #cccccc;
                    --ion-color-step-850: #d9d9d9;
                    --ion-color-step-900: #e6e6e6;
                    --ion-color-step-950: #f2f2f2;
                }
            }
            
            /* Explicit dark theme class */
            body.dark {
                --ion-background-color: #1e1e1e;
                --ion-text-color: #ffffff;
            }
            
            /* Animation improvements */
            .ion-page {
                contain: layout style;
            }
            
            /* Fix for overlays */
            ion-modal, ion-popover, ion-alert, ion-loading, ion-toast {
                --width: auto;
                --max-width: 90%;
                --max-height: 90%;
            }
            
            /* Better form field styling */
            ion-input, ion-textarea, ion-select {
                --padding-start: 16px;
                --padding-end: 16px;
            }
            
            /* List improvements */
            ion-list {
                background: transparent;
            }
            
            ion-item {
                --background: var(--ion-background-color);
                --color: var(--ion-text-color);
            }
            
            /* Card styling */
            ion-card {
                margin: 16px;
                border-radius: 8px;
            }
            
            /* Tab bar positioning */
            ion-tab-bar {
                border-top: 1px solid var(--ion-color-step-150);
            }
            
            /* Toolbar adjustments */
            ion-toolbar {
                --min-height: 56px;
            }
            
            /* Button improvements */
            ion-button {
                text-transform: none;
                font-weight: 500;
            }
            
            /* FAB positioning */
            ion-fab {
                position: fixed;
            }
            
            ion-fab[vertical="bottom"] {
                bottom: calc(16px + var(--ion-safe-area-bottom));
            }
            
            ion-fab[horizontal="end"] {
                right: calc(16px + var(--ion-safe-area-right));
            }
            
            /* Segment improvements */
            ion-segment {
                --background: var(--ion-color-step-50);
            }
            
            /* Fix for ion-datetime */
            ion-datetime {
                --background: var(--ion-background-color);
                --background-rgb: var(--ion-background-color-rgb);
            }
            
            /* Loading spinner colors */
            ion-loading {
                --spinner-color: var(--ion-color-primary);
            }
            
            /* Action sheet improvements */
            ion-action-sheet {
                --button-background-selected: var(--ion-color-step-150);
            }
        `;
        document.head.appendChild(customStyles);
        
        // Set platform mode based on user agent
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const mode = isIOS ? 'ios' : 'md';
        document.documentElement.setAttribute('mode', mode);
        
        ionicLoaded = true;
        console.log('[Ionic] Ionic Framework loaded successfully');
    },
    
    transform(el: Element, ctx: BridgeContext): void {
        const isValue = el.getAttribute('is');
        if (!isValue?.startsWith('ion-')) return;
        
        const tagName = isValue;
        
        // Get component-specific transform rules
        const transform = componentTransforms[tagName] || defaultTransform;
        
        // Collect attributes
        const baseAttrs = ctx.copyAttrs(el);
        const customAttrs = transform.attributes?.(el) || {};
        const attrs = { ...baseAttrs, ...customAttrs };
        delete attrs.is; // Remove is attribute
        
        // Platform mode detection if not set
        if (!attrs.mode) {
            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
            attrs.mode = isIOS ? 'ios' : 'md';
        }
        
        // Copy children
        const children = ctx.copyChildren(el);
        
        // Setup events with proper forwarding
        const events = transform.events?.(ctx) || {};
        
        // Replace element
        ctx.replaceWith(tagName, {
            attrs,
            events,
            slots: children
        });
    },
    
    destroy(): void {
        // Remove added styles and scripts
        document.getElementById('ionic-css')?.remove();
        document.getElementById('ionic-core')?.remove();
        document.getElementById('ionic-custom-styles')?.remove();
        
        // Clear initialization flag
        delete (window as any).__IONIC_INITIALIZED__;
        
        ionicLoaded = false;
        
        console.log('[Ionic] Bridge destroyed');
    }
};