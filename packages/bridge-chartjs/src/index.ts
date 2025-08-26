import type { BridgePreset, BridgeContext } from '@aits/core';

const chartjsPreset: BridgePreset = {
  name: 'chartjs',
  
  match(el: Element): boolean {
    const isAttr = el.getAttribute('is');
    return isAttr?.startsWith('chart-') ?? false;
  },
  
  async setup(env: 'client' | 'server'): Promise<void> {
    if (env === 'client' && !(window as any).Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  },
  
  transform(el: Element, ctx: BridgeContext): void {
    const isValue = el.getAttribute('is');
    if (!isValue) return;
    
    const chartType = isValue.replace('chart-', ''); // line, bar, pie...
    
    // 데이터 추출
    const dataScript = el.querySelector('script[type="application/json"]');
    const data = dataScript ? JSON.parse(dataScript.textContent || '{}') : {};
    
    // Canvas 생성
    const canvas = document.createElement('canvas');
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.appendChild(canvas);
    
    // 차트 생성 (클라이언트만)
    if (typeof window !== 'undefined' && (window as any).Chart) {
      new (window as any).Chart(canvas, {
        type: chartType,
        data: data.data || { datasets: [] },
        options: data.options || {}
      });
    }
    
    el.replaceWith(wrapper);
  }
};

export default chartjsPreset;