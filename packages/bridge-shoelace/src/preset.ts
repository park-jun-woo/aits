import type { BridgePreset, BridgeContext } from '@aits/core';
import { componentTransforms, defaultTransform } from './transforms';

let shoelaceLoaded = false;
let basePath: string | null = null;

export const shoelacePreset: BridgePreset = {
  name: 'shoelace',
  
  match(el: Element): boolean {
    const isAttr = el.getAttribute('is');
    return isAttr?.startsWith('sl-') ?? false;
  },
  
  async setup(env: 'client' | 'server'): Promise<void> {
    if (env === 'server' || shoelaceLoaded) return;
    
    console.log('[Shoelace] Loading Shoelace Web Components...');
    
    // 테마 CSS 로드
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.1/cdn/themes/light.css';
    themeLink.id = 'shoelace-theme-light';
    document.head.appendChild(themeLink);
    
    // 다크 테마 지원
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      const darkLink = document.createElement('link');
      darkLink.rel = 'stylesheet';
      darkLink.href = 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.1/cdn/themes/dark.css';
      darkLink.media = '(prefers-color-scheme: dark)';
      darkLink.id = 'shoelace-theme-dark';
      document.head.appendChild(darkLink);
    }
    
    // Shoelace 자동 로더
    const script = document.createElement('script');
    script.type = 'module';
    script.id = 'shoelace-autoloader';
    script.src = 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.1/cdn/shoelace-autoloader.js';
    
    await new Promise<void>((resolve, reject) => {
      script.onload = () => {
        // basePath 설정
        if ((window as any).setBasePath) {
          basePath = 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.1/cdn/';
          (window as any).setBasePath(basePath);
        }
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Shoelace'));
      document.head.appendChild(script);
    });
    
    // CSS 변수 설정
    const style = document.createElement('style');
    style.id = 'shoelace-custom-styles';
    style.textContent = `
      :root {
        --sl-color-primary-600: var(--aits-color-primary, #3b82f6);
        --sl-border-radius-medium: var(--aits-radius-md, 0.375rem);
        --sl-spacing-medium: var(--aits-spacing-md, 1rem);
        --sl-font-sans: var(--aits-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      }
      
      /* Z-index 조정 */
      sl-dialog::part(panel),
      sl-drawer::part(panel) {
        z-index: var(--sl-z-index-dialog, 700);
      }
      
      sl-tooltip::part(popup) {
        z-index: var(--sl-z-index-tooltip, 800);
      }
      
      /* 애니메이션 개선 */
      sl-dialog,
      sl-drawer {
        --sl-transition-medium: 250ms cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;
    document.head.appendChild(style);
    
    shoelaceLoaded = true;
    console.log('[Shoelace] Loaded successfully');
  },
  
  transform(el: Element, ctx: BridgeContext): void {
    const isValue = el.getAttribute('is');
    if (!isValue?.startsWith('sl-')) return;
    
    const tagName = isValue;
    
    // 컴포넌트별 변환 규칙 가져오기
    const transform = componentTransforms[tagName] || defaultTransform;
    
    // 속성 수집
    const baseAttrs = ctx.copyAttrs(el);
    const customAttrs = transform.attributes?.(el) || {};
    const attrs = { ...baseAttrs, ...customAttrs };
    delete attrs.is; // is 속성 제거
    
    // 자식 노드 복사
    const children = ctx.copyChildren(el);
    
    // 이벤트 설정
    const events = transform.events?.(ctx) || {};
    
    // 요소 교체
    ctx.replaceWith(tagName, {
      attrs,
      events,
      slots: children
    });
  },
  
  destroy(): void {
    // 추가된 스타일과 스크립트 제거
    document.getElementById('shoelace-theme-light')?.remove();
    document.getElementById('shoelace-theme-dark')?.remove();
    document.getElementById('shoelace-autoloader')?.remove();
    document.getElementById('shoelace-custom-styles')?.remove();
    
    shoelaceLoaded = false;
    basePath = null;
    
    console.log('[Shoelace] Bridge destroyed');
  }
};