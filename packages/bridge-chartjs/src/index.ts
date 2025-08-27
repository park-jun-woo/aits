// src/index.ts - Chart.js Bridge 메인 파일
import { registerBridge, BridgeUtils } from '@aits/core';
import { chartjsPreset } from './preset';

// Chart.js 타입을 helpers에서 import
import type { Chart as ChartJSType } from 'chart.js';

// helpers에서 함수와 타입 import
import {
  createChart,
  updateChartData,
  updateChartOptions,
  chartToImage,
  chartToCSV,
  resizeChart,
  animateChart,
  toggleDataset,
  showAllDatasets,
  hideAllDatasets,
  changeChartType,
  addRealtimeData,
  removeOldestData,
  addDataPoint,
  removeDataPoint,
  resetChartData,
  destroyChart,
  type Chart,
  type ChartElement,
  type ChartData,
  type ChartOptions,
  type ChartConfig
} from './helpers';

// 타입 export
export type { 
  Chart,
  ChartElement,
  ChartData,
  ChartOptions,
  ChartConfig
};

// Chart.js 네이티브 타입도 export
export type { ChartJSType };

// 프리셋 export
export { chartjsPreset };
export default chartjsPreset;

// 헬퍼 함수들 export
export {
  createChart,
  updateChartData,
  updateChartOptions,
  chartToImage,
  chartToCSV,
  resizeChart,
  animateChart,
  toggleDataset,
  showAllDatasets,
  hideAllDatasets,
  changeChartType,
  addRealtimeData,
  removeOldestData,
  addDataPoint,
  removeDataPoint,
  resetChartData,
  destroyChart
};

// 설정 옵션
export interface ChartJSConfig {
  autoRegister?: boolean;
  autoTransform?: boolean;
  defaultColors?: string[];
  defaultFont?: string;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
}

/**
 * Chart.js 브리지 초기화
 */
export async function initChartJS(config: ChartJSConfig = {}): Promise<void> {
  // 브리지 등록
  if (config.autoRegister !== false) {
    registerBridge(chartjsPreset);
  }
  
  // 자동 변환 시작
  if (config.autoTransform) {
    BridgeUtils.startAutoTransform();
  }
  
  // Chart.js 로드 대기
  await chartjsPreset.setup?.('client');
  
  // 커스텀 설정 적용
  const ChartJS = (window as any).Chart;
  if (ChartJS) {
    // 기본 색상 설정
    if (config.defaultColors && config.defaultColors.length > 0) {
      ChartJS.defaults.backgroundColor = config.defaultColors;
      ChartJS.defaults.borderColor = config.defaultColors;
    }
    
    // 기본 폰트 설정
    if (config.defaultFont) {
      ChartJS.defaults.font.family = config.defaultFont;
    }
    
    // 반응형 설정
    if (config.responsive !== undefined) {
      ChartJS.defaults.responsive = config.responsive;
    }
    
    // 종횡비 유지 설정
    if (config.maintainAspectRatio !== undefined) {
      ChartJS.defaults.maintainAspectRatio = config.maintainAspectRatio;
    }
    
    // 종횡비 설정
    if (config.aspectRatio !== undefined) {
      ChartJS.defaults.aspectRatio = config.aspectRatio;
    }
  }
  
  console.log('[ChartJS] Bridge initialized');
}

/**
 * 차트 업데이트를 위한 유틸리티 함수
 * @param element - HTMLElement 또는 CSS 선택자
 * @returns Chart 인스턴스 또는 null
 */
export function getChart(element: HTMLElement | string): ChartJSType | null {
  const el = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
  
  if (!el) return null;
  
  // Canvas 요소 찾기
  let canvas: HTMLCanvasElement | null = null;
  
  if (el instanceof HTMLCanvasElement) {
    canvas = el;
  } else {
    canvas = el.querySelector('canvas');
  }
  
  if (!canvas) return null;
  
  // 차트 인스턴스 반환
  return (canvas as ChartElement).chart || null;
}

/**
 * 특정 컨테이너 내의 모든 차트 가져오기
 * @param container - 검색할 컨테이너 (기본값: document)
 * @returns Chart 인스턴스 배열
 */
export function getChartsIn(container: HTMLElement | Document = document): ChartJSType[] {
  const charts: ChartJSType[] = [];
  const canvases = container.querySelectorAll('.chart-canvas');
  
  canvases.forEach(canvas => {
    const chart = (canvas as ChartElement).chart;
    if (chart) {
      charts.push(chart);
    }
  });
  
  return charts;
}

/**
 * 모든 차트 가져오기
 * @returns 페이지의 모든 Chart 인스턴스 배열
 */
export function getAllCharts(): ChartJSType[] {
  return getChartsIn(document);
}

/**
 * 차트 존재 여부 확인
 * @param element - HTMLElement 또는 CSS 선택자
 * @returns 차트 존재 여부
 */
export function hasChart(element: HTMLElement | string): boolean {
  return getChart(element) !== null;
}

/**
 * 여러 차트를 일괄 업데이트
 * @param charts - 업데이트할 차트 배열
 * @param data - 새로운 데이터 (선택적)
 * @param options - 새로운 옵션 (선택적)
 */
export function batchUpdateCharts(
  charts: ChartJSType[],
  data?: ChartData,
  options?: ChartOptions
): void {
  charts.forEach(chart => {
    if (data) {
      updateChartData(chart, data);
    }
    if (options) {
      updateChartOptions(chart, options, false);
    }
    chart.update();
  });
}

/**
 * 차트 데이터를 JSON으로 export
 * @param chart - Chart 인스턴스
 * @returns JSON 문자열
 */
export function chartToJSON(chart: ChartJSType): string {
  // Chart.js v4에서는 config에 직접 type 속성이 없을 수 있음
  // data와 options만 추출
  return JSON.stringify({
    type: (chart as any).config?.type || 'line',  // fallback to 'line'
    data: chart.data,
    options: chart.options
  }, null, 2);
}

/**
 * JSON에서 차트 생성
 * @param canvas - 차트를 그릴 캔버스
 * @param json - JSON 문자열 또는 객체
 * @returns 생성된 Chart 인스턴스
 */
export async function createChartFromJSON(
  canvas: HTMLCanvasElement,
  json: string | object
): Promise<ChartJSType> {
  const config = typeof json === 'string' ? JSON.parse(json) : json;
  return createChart(canvas, config as ChartConfig);
}

// DOM 준비 시 자동 초기화
if (typeof window !== 'undefined') {
  // 전역 네임스페이스 등록
  (window as any).ChartJSBridge = {
    // 초기화
    init: initChartJS,
    preset: chartjsPreset,
    
    // 차트 생성
    createChart,
    createChartFromJSON,
    
    // 차트 검색
    getChart,
    getChartsIn,
    getAllCharts,
    hasChart,
    
    // 차트 업데이트
    updateChartData,
    updateChartOptions,
    batchUpdateCharts,
    
    // 차트 제어
    resizeChart,
    animateChart,
    toggleDataset,
    showAllDatasets,
    hideAllDatasets,
    changeChartType,
    
    // 실시간 데이터
    addRealtimeData,
    removeOldestData,
    addDataPoint,
    removeDataPoint,
    resetChartData,
    
    // Export
    chartToImage,
    chartToCSV,
    chartToJSON,
    
    // 정리
    destroyChart
  };
  
  // data-auto-init 속성이 있으면 자동 초기화
  document.addEventListener('DOMContentLoaded', () => {
    const script = document.querySelector('script[data-chartjs-auto-init]');
    if (script) {
      const config: ChartJSConfig = {
        autoRegister: true,
        autoTransform: true
      };
      
      // 기본 색상 설정
      const colors = script.getAttribute('data-default-colors');
      if (colors) {
        config.defaultColors = colors.split(',').map(c => c.trim());
      }
      
      // 기본 폰트 설정
      const font = script.getAttribute('data-default-font');
      if (font) {
        config.defaultFont = font;
      }
      
      // 반응형 설정
      const responsive = script.getAttribute('data-responsive');
      if (responsive) {
        config.responsive = responsive !== 'false';
      }
      
      // 종횡비 설정
      const aspectRatio = script.getAttribute('data-aspect-ratio');
      if (aspectRatio) {
        config.aspectRatio = parseFloat(aspectRatio);
      }
      
      initChartJS(config).catch(error => {
        console.error('[ChartJS] Auto-initialization failed:', error);
      });
    }
  });
  
  // 개발자 도구 지원
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    console.log('[ChartJS Bridge] Development mode enabled');
    console.log('Access window.ChartJSBridge for debugging');
  }
}