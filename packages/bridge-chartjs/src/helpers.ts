// src/helpers.ts - Chart.js 헬퍼 함수
import type { 
  Chart as ChartJS, 
  ChartConfiguration, 
  ChartType,
  ChartData as ChartJSData,
  ChartOptions as ChartJSOptions,
  ChartDataset
} from 'chart.js';

// types.ts에서 모든 타입 import
import {
  type Chart,
  type ChartElement,
  type ChartData,
  type ChartOptions,
  type ChartConfig
} from './types';

// 타입 re-export
export type { Chart, ChartElement, ChartData, ChartOptions, ChartConfig };

/**
 * Chart.js가 로드될 때까지 대기
 */
async function ensureChartJsLoaded(): Promise<void> {
  if (typeof (window as any).Chart !== 'undefined') {
    return;
  }

  return new Promise<void>((resolve) => {
    const check = () => {
      if (typeof (window as any).Chart !== 'undefined') {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

/**
 * 차트 생성
 */
export async function createChart(
  canvas: HTMLCanvasElement,
  config: ChartConfig
): Promise<Chart> {
  await ensureChartJsLoaded();
  
  const ChartJS = (window as any).Chart as typeof import('chart.js').Chart;
  
  // 기존 차트가 있으면 제거
  const existingChart = (canvas as ChartElement).chart;
  if (existingChart) {
    existingChart.destroy();
  }
  
  // ChartConfiguration 생성 - any 타입으로 캐스팅하여 타입 호환성 문제 해결
  const chartConfig: ChartConfiguration = {
    type: config.type,
    data: config.data as any,  // ChartJSData로 강제 변환
    options: (config.options || {}) as any  // ChartJSOptions로 강제 변환
  };
  
  const chart = new ChartJS(canvas, chartConfig);
  
  // 캔버스에 차트 인스턴스 저장
  (canvas as ChartElement).chart = chart;
  
  return chart;
}

/**
 * 차트 데이터 업데이트
 */
export function updateChartData(
  chart: Chart,
  data: ChartData,
  mode: 'none' | 'hide' | 'show' | 'default' | 'active' | 'resize' | 'reset' = 'default'
): void {
  // ChartJS 데이터 형식으로 변환
  chart.data = data as any;  // ChartJSData로 강제 변환
  chart.update(mode);
}

/**
 * 차트 옵션 업데이트
 */
export function updateChartOptions(
  chart: Chart,
  options: ChartOptions,
  update: boolean = true
): void {
  Object.assign(chart.options, options);
  if (update) {
    chart.update();
  }
}

/**
 * 차트를 이미지로 변환
 */
export function chartToImage(chart: Chart, type: 'png' | 'jpeg' = 'png'): string {
  const mimeType = type === 'jpeg' ? 'image/jpeg' : 'image/png';
  return chart.toBase64Image(mimeType, 1);
}

/**
 * 차트 데이터를 CSV로 변환
 */
export function chartToCSV(chart: Chart): string {
  const data = chart.data;
  const labels = data.labels || [];
  const datasets = data.datasets || [];
  
  // 헤더 생성
  const headers = ['Label', ...datasets.map((ds, i) => ds.label || `Dataset ${i + 1}`)];
  const rows: string[][] = [headers];
  
  // 데이터 행 생성
  labels.forEach((label, index) => {
    const row = [String(label)];
    datasets.forEach((ds: ChartDataset) => {
      const dataPoint = ds.data[index];
      let value: any = '';
      
      if (dataPoint !== null && dataPoint !== undefined) {
        if (typeof dataPoint === 'object' && 'y' in dataPoint) {
          value = (dataPoint as any).y;
        } else {
          value = dataPoint;
        }
      }
      
      row.push(String(value));
    });
    rows.push(row);
  });
  
  // CSV 문자열 생성
  return rows.map(row => row.join(',')).join('\n');
}

/**
 * 차트 리사이즈
 */
export function resizeChart(chart: Chart): void {
  chart.resize();
}

/**
 * 차트 애니메이션 재생
 */
export function animateChart(chart: Chart): void {
  chart.reset();
  chart.update('show');
}

/**
 * 데이터셋 표시/숨기기
 */
export function toggleDataset(chart: Chart, datasetIndex: number): void {
  const meta = chart.getDatasetMeta(datasetIndex);
  if (meta) {
    meta.hidden = meta.hidden === null ? true : !meta.hidden;
    chart.update();
  }
}

/**
 * 모든 데이터셋 표시
 */
export function showAllDatasets(chart: Chart): void {
  chart.data.datasets?.forEach((_, index) => {
    const meta = chart.getDatasetMeta(index);
    if (meta) {
      meta.hidden = false;
    }
  });
  chart.update();
}

/**
 * 모든 데이터셋 숨기기
 */
export function hideAllDatasets(chart: Chart): void {
  chart.data.datasets?.forEach((_, index) => {
    const meta = chart.getDatasetMeta(index);
    if (meta) {
      meta.hidden = true;
    }
  });
  chart.update();
}

/**
 * 차트 타입 변경
 * Chart.js v4에서는 직접적인 타입 변경이 제한적이므로 재생성 권장
 */
export function changeChartType(chart: Chart, newType: ChartType): void {
  // 현재 설정과 데이터 저장
  const currentData = chart.data;
  const currentOptions = chart.options;
  const canvas = chart.canvas as HTMLCanvasElement;
  
  // 기존 차트 제거
  chart.destroy();
  
  // 새 차트 생성
  const ChartJS = (window as any).Chart as typeof import('chart.js').Chart;
  const newConfig: ChartConfiguration = {
    type: newType,
    data: currentData,
    options: currentOptions
  };
  
  const newChart = new ChartJS(canvas, newConfig);
  
  // 캔버스에 새 차트 인스턴스 저장
  (canvas as ChartElement).chart = newChart;
}

/**
 * 실시간 데이터 추가
 */
export function addRealtimeData(
  chart: Chart,
  label: string,
  data: number | number[] | any
): void {
  // 라벨 추가
  if (chart.data.labels) {
    chart.data.labels.push(label);
  }
  
  // 데이터 추가
  if (Array.isArray(data)) {
    chart.data.datasets.forEach((dataset, index) => {
      const value = data[index] !== undefined ? data[index] : 0;
      (dataset.data as any[]).push(value);
    });
  } else {
    // 첫 번째 데이터셋에만 추가
    if (chart.data.datasets[0]) {
      (chart.data.datasets[0].data as any[]).push(data);
    }
  }
  
  chart.update();
}

/**
 * 실시간 데이터 제거 (가장 오래된 데이터)
 */
export function removeOldestData(chart: Chart): void {
  // 라벨 제거
  if (chart.data.labels && chart.data.labels.length > 0) {
    chart.data.labels.shift();
  }
  
  // 데이터 제거
  chart.data.datasets.forEach((dataset) => {
    if (Array.isArray(dataset.data) && dataset.data.length > 0) {
      (dataset.data as any[]).shift();
    }
  });
  
  chart.update();
}

/**
 * 데이터 포인트 추가 (특정 인덱스)
 */
export function addDataPoint(
  chart: Chart,
  datasetIndex: number,
  dataPoint: any,
  label?: string
): void {
  if (chart.data.datasets[datasetIndex]) {
    (chart.data.datasets[datasetIndex].data as any[]).push(dataPoint);
    
    if (label && chart.data.labels) {
      chart.data.labels.push(label);
    }
    
    chart.update();
  }
}

/**
 * 데이터 포인트 제거 (특정 인덱스)
 */
export function removeDataPoint(
  chart: Chart,
  datasetIndex: number,
  pointIndex: number
): void {
  if (chart.data.datasets[datasetIndex]) {
    (chart.data.datasets[datasetIndex].data as any[]).splice(pointIndex, 1);
    
    if (chart.data.labels && chart.data.labels[pointIndex] !== undefined) {
      chart.data.labels.splice(pointIndex, 1);
    }
    
    chart.update();
  }
}

/**
 * 차트 데이터 리셋
 */
export function resetChartData(chart: Chart): void {
  chart.data.labels = [];
  chart.data.datasets.forEach(dataset => {
    dataset.data = [];
  });
  chart.update();
}

/**
 * 차트 파괴 (메모리 정리)
 */
export function destroyChart(chart: Chart): void {
  chart.destroy();
}