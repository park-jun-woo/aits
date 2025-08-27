// src/preset.ts - Chart.js Bridge Preset
import type { BridgePreset, BridgeContext } from '@aits/core';
import { chartTransforms, defaultChartTransform } from './transforms';
import { createChart } from './helpers';
// types.ts에서 ChartConfig import
import type { ChartConfig } from './types';

let chartjsLoaded = false;
let chartjsLoadPromise: Promise<void> | null = null;

/**
 * Chart.js 라이브러리 로드
 */
async function loadChartJs(): Promise<void> {
  if (chartjsLoaded) return;
  if (chartjsLoadPromise) return chartjsLoadPromise;
  
  chartjsLoadPromise = (async () => {
    console.log('[ChartJS] Loading Chart.js...');
    
    // CDN URL 설정 (최신 버전)
    const cdnUrl = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
    
    // 스크립트 태그 생성
    const script = document.createElement('script');
    script.src = cdnUrl;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    // 로드 promise
    await new Promise<void>((resolve, reject) => {
      script.onload = () => {
        chartjsLoaded = true;
        console.log('[ChartJS] Chart.js loaded successfully');
        resolve();
      };
      script.onerror = () => {
        chartjsLoaded = false;
        chartjsLoadPromise = null;
        reject(new Error('Failed to load Chart.js'));
      };
      document.head.appendChild(script);
    });
    
    // Chart.js 전역 설정
    const ChartJS = (window as any).Chart;
    if (ChartJS) {
      // 기본 폰트 설정
      ChartJS.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      ChartJS.defaults.font.size = 12;
      
      // 기본 색상 설정
      ChartJS.defaults.color = '#666';
      ChartJS.defaults.borderColor = 'rgba(0, 0, 0, 0.1)';
      ChartJS.defaults.backgroundColor = 'rgba(0, 0, 0, 0.05)';
      
      // 기본 반응형 설정
      ChartJS.defaults.responsive = true;
      ChartJS.defaults.maintainAspectRatio = false;
      
      // 애니메이션 설정
      ChartJS.defaults.animation.duration = 750;
      
      // 상호작용 설정
      ChartJS.defaults.interaction.mode = 'nearest';
      ChartJS.defaults.interaction.intersect = false;
      
      // 플러그인 기본값
      ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
      ChartJS.defaults.plugins.tooltip.cornerRadius = 4;
      
      console.log('[ChartJS] Default settings applied');
    }
  })().catch((error) => {
    chartjsLoadPromise = null;
    throw error;
  });
  
  return chartjsLoadPromise;
}

/**
 * Chart.js Bridge Preset
 */
export const chartjsPreset: BridgePreset = {
  name: 'chartjs',
  
  /**
   * 요소가 Chart.js 컴포넌트인지 확인
   */
  match(el: Element): boolean {
    const isAttr = el.getAttribute('is');
    if (!isAttr) return false;
    
    // chart-로 시작하는 모든 속성값 매칭
    return isAttr.startsWith('chart-');
  },
  
  /**
   * 환경별 설정
   */
  async setup(env: 'client' | 'server'): Promise<void> {
    // 서버 환경에서는 아무것도 하지 않음
    if (env === 'server') return;
    
    // 클라이언트 환경에서 Chart.js 로드
    try {
      await loadChartJs();
    } catch (error) {
      console.error('[ChartJS] Failed to load Chart.js:', error);
      throw error;
    }
  },
  
  /**
   * 요소를 차트로 변환
   */
  transform(el: Element, ctx: BridgeContext): void {
    const isValue = el.getAttribute('is');
    if (!isValue?.startsWith('chart-')) return;
    
    // 차트 타입별 변환 규칙 가져오기
    const transform = chartTransforms[isValue] || defaultChartTransform;
    
    try {
      // 설정 추출
      const config = transform.extractConfig(el);
      
      // 데이터 유효성 검사
      if (!config.data || !config.data.datasets) {
        console.warn(`[ChartJS] No data found for ${isValue}`);
        config.data = { datasets: [] };
      }
      
      // 컨테이너 생성
      const wrapper = transform.setupContainer(el);
      
      // 기본 클래스 추가
      wrapper.classList.add('chartjs-wrapper', `chartjs-${config.type}`);
      
      // Canvas 생성
      const canvas = document.createElement('canvas');
      canvas.className = 'chart-canvas';
      
      // 고해상도 디스플레이 지원
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      
      // 접근성 속성 설정
      const ariaLabel = el.getAttribute('aria-label') || 
                       el.getAttribute('data-label') ||
                       `${config.type} chart`;
      canvas.setAttribute('aria-label', ariaLabel);
      canvas.setAttribute('role', 'img');
      
      // ID 복사 (있는 경우)
      const id = el.getAttribute('id');
      if (id) {
        canvas.id = `${id}-canvas`;
        wrapper.id = id;
      }
      
      // 데이터 속성 복사
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          wrapper.setAttribute(attr.name, attr.value);
        }
      });
      
      wrapper.appendChild(canvas);
      
      // 차트 생성 (비동기로 실행)
      if (typeof window !== 'undefined' && chartjsLoaded) {
        // 다음 프레임에서 차트 생성 (DOM 업데이트 이후)
        requestAnimationFrame(() => {
          createChart(canvas, config)
            .then(chart => {
              // 차트 생성 성공 이벤트
              wrapper.dispatchEvent(new CustomEvent('chartjs:created', {
                detail: { chart },
                bubbles: true
              }));
            })
            .catch(error => {
              console.error('[ChartJS] Failed to create chart:', error);
              
              // 에러 표시
              wrapper.innerHTML = `
                <div class="chartjs-error" style="
                  padding: 20px;
                  text-align: center;
                  color: #721c24;
                  background-color: #f8d7da;
                  border: 1px solid #f5c6cb;
                  border-radius: 4px;
                ">
                  <strong>Chart Error:</strong> ${error.message}
                </div>
              `;
              
              // 차트 생성 실패 이벤트
              wrapper.dispatchEvent(new CustomEvent('chartjs:error', {
                detail: { error },
                bubbles: true
              }));
            });
        });
      } else {
        // Chart.js가 아직 로드되지 않은 경우
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'chartjs-loading';
        loadingMessage.style.cssText = 'padding: 20px; text-align: center; color: #666;';
        loadingMessage.textContent = 'Loading chart...';
        wrapper.appendChild(loadingMessage);
        
        // Chart.js 로드 대기 후 차트 생성
        loadChartJs().then(() => {
          loadingMessage.remove();
          createChart(canvas, config).catch(console.error);
        });
      }
      
      // DOM에서 교체
      el.replaceWith(wrapper);
      
    } catch (error) {
      console.error('[ChartJS] Transform error:', error);
      
      // 에러 요소 생성
      const errorEl = document.createElement('div');
      errorEl.className = 'chartjs-error';
      errorEl.style.cssText = 'padding: 20px; color: red; border: 1px solid red;';
      errorEl.textContent = `Chart error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      el.replaceWith(errorEl);
    }
  },
  
  /**
   * 정리 함수
   */
  destroy(): void {
    // 모든 차트 인스턴스 정리
    const canvases = document.querySelectorAll('.chart-canvas');
    let destroyedCount = 0;
    
    canvases.forEach(canvas => {
      const chart = (canvas as any).chart;
      if (chart && typeof chart.destroy === 'function') {
        try {
          chart.destroy();
          destroyedCount++;
        } catch (error) {
          console.error('[ChartJS] Error destroying chart:', error);
        }
      }
    });
    
    // Chart.js 스크립트 태그 제거
    const scripts = document.querySelectorAll('script[src*="chart.js"], script[src*="chart.umd.min.js"]');
    scripts.forEach(script => script.remove());
    
    // 상태 초기화
    chartjsLoaded = false;
    chartjsLoadPromise = null;
    
    console.log(`[ChartJS] Bridge destroyed. ${destroyedCount} charts cleaned up.`);
  }
};

// Default export
export default chartjsPreset;