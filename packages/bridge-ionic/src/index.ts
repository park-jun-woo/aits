import type { BridgePreset, BridgeContext } from '@aits/core';

const ionicPreset: BridgePreset = {
  name: 'ionic',
  
  match(el: Element): boolean {
    const isAttr = el.getAttribute('is');
    return isAttr?.startsWith('ion-') ?? false;
  },
  
  async setup(env: 'client' | 'server'): Promise<void> {
    if (env === 'client') {
      // Ionic CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css';
      document.head.appendChild(link);
      
      // Ionic Core
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js';
      document.head.appendChild(script);
    }
  },
  
  transform(el: Element, ctx: BridgeContext): void {
    const isValue = el.getAttribute('is');
    if (!isValue) return;
    
    const tagName = isValue;
    const attrs = ctx.copyAttrs(el);
    const children = ctx.copyChildren(el);
    
    // 플랫폼 자동 감지
    if (!attrs.mode) {
      attrs.mode = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'md';
    }
    
    ctx.replaceWith(tagName, {
      attrs,
      slots: children,
      events: {
        'ionChange': ctx.forward('change'),
        'ionInput': ctx.forward('input'),
        'ionClick': ctx.forward('click')
      }
    });
  }
};

export default ionicPreset;