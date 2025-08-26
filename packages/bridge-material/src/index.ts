import type { BridgePreset, BridgeContext } from '@aits/core';

const materialPreset: BridgePreset = {
  name: 'material',
  
  match(el: Element): boolean {
    const isAttr = el.getAttribute('is');
    return isAttr?.startsWith('md-') ?? false;
  },
  
  async setup(env: 'client' | 'server'): Promise<void> {
    if (env === 'client') {
      // Material 3 토큰 CSS 변수
      const style = document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap');
        :root {
          --md-sys-color-primary: #6750a4;
          --md-sys-color-on-primary: #ffffff;
          --md-sys-typescale-body-medium-font: 'Roboto', sans-serif;
        }
      `;
      document.head.appendChild(style);
    }
  },
  
  transform(el: Element, ctx: BridgeContext): void {
    const isValue = el.getAttribute('is');
    if (!isValue) return;
    
    const tagName = isValue;
    const attrs = ctx.copyAttrs(el);
    const children = ctx.copyChildren(el);
    
    // Material 컴포넌트 동적 로드
    if (typeof window !== 'undefined') {
      loadMaterialComponent(tagName);
    }
    
    ctx.replaceWith(tagName, {
      attrs,
      slots: children,
      events: getMaterialEvents(tagName, ctx)
    });
  }
};

async function loadMaterialComponent(tagName: string): Promise<void> {
  // 컴포넌트별 ESM import
  const componentMap: Record<string, string> = {
    'md-filled-button': '@material/web/button/filled-button.js',
    'md-outlined-button': '@material/web/button/outlined-button.js',
    'md-checkbox': '@material/web/checkbox/checkbox.js',
    'md-dialog': '@material/web/dialog/dialog.js',
  };
  
  const path = componentMap[tagName];
  if (path && !customElements.get(tagName)) {
    await import(`https://esm.run/${path}`);
  }
}

function getMaterialEvents(tagName: string, ctx: BridgeContext): Record<string, EventListener> {
  const events: Record<string, EventListener> = {};
  
  if (tagName.includes('button')) {
    events.click = ctx.forward('click');
  } else if (tagName === 'md-checkbox' || tagName === 'md-switch') {
    events.change = ctx.forward('change');
  }
  
  return events;
}

export default materialPreset;