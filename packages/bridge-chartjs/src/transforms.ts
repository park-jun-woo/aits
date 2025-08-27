// src/transforms.ts - 차트 변환 규칙
import type { BridgeContext } from '@aits/core';
// types.ts에서 타입 import
import type { ChartConfig, ChartData, ChartOptions } from './types';

/**
 * 차트 변환 인터페이스
 */
export interface ChartTransform {
  extractConfig(el: Element): ChartConfig;
  setupContainer(el: Element): HTMLElement;
}

/**
 * 기본 차트 설정 추출
 */
function extractBaseConfig(el: Element): Partial<ChartConfig> {
  const config: Partial<ChartConfig> = {};
  
  // 1. JSON script 태그에서 데이터 추출
  const dataScript = el.querySelector('script[type="application/json"]');
  if (dataScript && dataScript.textContent) {
    try {
      const jsonData = JSON.parse(dataScript.textContent);
      if (jsonData.data) {
        config.data = jsonData.data;
      }
      if (jsonData.options) {
        config.options = jsonData.options;
      }
    } catch (error) {
      console.error('[ChartJS] Failed to parse JSON data:', error);
    }
  }
  
  // 2. CSV 데이터 추출
  const csvScript = el.querySelector('script[type="text/csv"]');
  if (csvScript && csvScript.textContent && !config.data) {
    config.data = parseCSVData(csvScript.textContent);
  }
  
  // 3. data 속성에서 간단한 데이터 추출
  const dataLabels = el.getAttribute('data-labels');
  const dataValues = el.getAttribute('data-values');
  if (dataLabels && dataValues && !config.data) {
    config.data = {
      labels: dataLabels.split(',').map(l => l.trim()),
      datasets: [{
        data: dataValues.split(',').map(v => parseFloat(v.trim()))
      }]
    };
  }
  
  // 4. 옵션 초기화
  if (!config.options) {
    config.options = {};
  }
  
  // 5. data 속성에서 옵션 추출
  const responsiveAttr = el.getAttribute('data-responsive');
  if (responsiveAttr !== null) {
    config.options.responsive = responsiveAttr !== 'false';
  }
  
  const aspectRatioAttr = el.getAttribute('data-aspect-ratio');
  if (aspectRatioAttr) {
    config.options.aspectRatio = parseFloat(aspectRatioAttr);
    if (config.options.aspectRatio) {
      config.options.maintainAspectRatio = true;
    }
  }
  
  const titleAttr = el.getAttribute('data-title');
  if (titleAttr) {
    if (!config.options.plugins) {
      config.options.plugins = {};
    }
    config.options.plugins.title = {
      display: true,
      text: titleAttr,
      padding: 10,
      font: {
        size: 16,
        weight: 'bold'
      }
    };
  }
  
  // 6. 색상 테마 적용
  const themeAttr = el.getAttribute('data-theme');
  if (themeAttr && config.data?.datasets) {
    const colors = getThemeColors(themeAttr);
    config.data.datasets.forEach((dataset, index) => {
      if (!dataset.backgroundColor) {
        dataset.backgroundColor = colors[index % colors.length];
      }
      if (!dataset.borderColor) {
        dataset.borderColor = colors[index % colors.length];
      }
    });
  }
  
  return config;
}

/**
 * CSV 데이터 파싱
 */
function parseCSVData(csvText: string): ChartData {
  const lines = csvText.trim().split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length < 2) {
    return { datasets: [] };
  }
  
  // 헤더 파싱
  const headers = lines[0].split(',').map(h => h.trim());
  const labels: string[] = [];
  const datasets: number[][] = headers.slice(1).map(() => []);
  
  // 데이터 파싱
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    // 첫 번째 열은 라벨
    labels.push(values[0] || `Item ${i}`);
    
    // 나머지 열은 데이터셋 값
    for (let j = 1; j < values.length && j - 1 < datasets.length; j++) {
      const numValue = parseFloat(values[j]);
      datasets[j - 1].push(isNaN(numValue) ? 0 : numValue);
    }
  }
  
  return {
    labels,
    datasets: datasets.map((data, index) => ({
      label: headers[index + 1] || `Dataset ${index + 1}`,
      data
    }))
  };
}

/**
 * 테마별 색상 팔레트
 */
function getThemeColors(theme: string): string[] {
  const themes: Record<string, string[]> = {
    default: [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ],
    pastel: [
      'rgba(255, 179, 186, 0.8)',
      'rgba(255, 223, 186, 0.8)',
      'rgba(255, 255, 186, 0.8)',
      'rgba(186, 255, 201, 0.8)',
      'rgba(186, 225, 255, 0.8)',
      'rgba(255, 186, 255, 0.8)'
    ],
    dark: [
      'rgba(48, 48, 48, 0.8)',
      'rgba(96, 96, 96, 0.8)',
      'rgba(144, 144, 144, 0.8)',
      'rgba(192, 192, 192, 0.8)',
      'rgba(240, 240, 240, 0.8)'
    ],
    vibrant: [
      'rgba(255, 0, 0, 0.8)',
      'rgba(0, 255, 0, 0.8)',
      'rgba(0, 0, 255, 0.8)',
      'rgba(255, 255, 0, 0.8)',
      'rgba(255, 0, 255, 0.8)',
      'rgba(0, 255, 255, 0.8)'
    ]
  };
  
  return themes[theme] || themes.default;
}

/**
 * 각 차트 타입별 변환 규칙
 */
export const chartTransforms: Record<string, ChartTransform> = {
  'chart-line': {
    extractConfig(el: Element): ChartConfig {
      const baseConfig = extractBaseConfig(el);
      const beginAtZero = el.getAttribute('data-begin-at-zero') !== 'false';
      const smooth = el.getAttribute('data-smooth') !== 'false';
      
      // Line 차트 기본값 설정
      if (baseConfig.data?.datasets) {
        baseConfig.data.datasets.forEach(dataset => {
          if (dataset.tension === undefined && smooth) {
            dataset.tension = 0.4;
          }
          if (dataset.fill === undefined) {
            dataset.fill = false;
          }
        });
      }
      
      return {
        type: 'line',
        data: baseConfig.data || { datasets: [] },
        options: {
          ...baseConfig.options,
          scales: {
            y: {
              beginAtZero
            }
          }
        }
      };
    },
    setupContainer(el: Element): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-container chart-container-line';
      wrapper.style.position = 'relative';
      
      const width = el.getAttribute('data-width') || '100%';
      const height = el.getAttribute('data-height') || '400px';
      
      wrapper.style.width = width;
      wrapper.style.height = height;
      
      return wrapper;
    }
  },
  
  'chart-bar': {
    extractConfig(el: Element): ChartConfig {
      const baseConfig = extractBaseConfig(el);
      const horizontal = el.getAttribute('data-horizontal') === 'true';
      const stacked = el.getAttribute('data-stacked') === 'true';
      
      const options: ChartOptions = {
        ...baseConfig.options,
        indexAxis: horizontal ? 'y' as const : 'x' as const,
        scales: {
          x: { stacked },
          y: { 
            stacked,
            beginAtZero: true 
          }
        }
      };
      
      return {
        type: 'bar',
        data: baseConfig.data || { datasets: [] },
        options
      };
    },
    setupContainer(el: Element): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-container chart-container-bar';
      wrapper.style.position = 'relative';
      
      const width = el.getAttribute('data-width') || '100%';
      const height = el.getAttribute('data-height') || '400px';
      
      wrapper.style.width = width;
      wrapper.style.height = height;
      
      return wrapper;
    }
  },
  
  'chart-pie': {
    extractConfig(el: Element): ChartConfig {
      const baseConfig = extractBaseConfig(el);
      const legendPosition = el.getAttribute('data-legend-position') || 'top';
      
      return {
        type: 'pie',
        data: baseConfig.data || { datasets: [] },
        options: {
          ...baseConfig.options,
          responsive: true,
          plugins: {
            ...baseConfig.options?.plugins,
            legend: {
              display: true,
              position: legendPosition as any
            }
          }
        }
      };
    },
    setupContainer(el: Element): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-container chart-container-pie';
      wrapper.style.position = 'relative';
      
      const maxWidth = el.getAttribute('data-max-width') || '400px';
      wrapper.style.maxWidth = maxWidth;
      wrapper.style.margin = '0 auto';
      
      const height = el.getAttribute('data-height') || '400px';
      wrapper.style.height = height;
      
      return wrapper;
    }
  },
  
  'chart-doughnut': {
    extractConfig(el: Element): ChartConfig {
      const baseConfig = extractBaseConfig(el);
      const cutout = el.getAttribute('data-cutout') || '50%';
      const legendPosition = el.getAttribute('data-legend-position') || 'top';
      
      return {
        type: 'doughnut',
        data: baseConfig.data || { datasets: [] },
        options: {
          ...baseConfig.options,
          cutout,
          plugins: {
            ...baseConfig.options?.plugins,
            legend: {
              display: true,
              position: legendPosition as any
            }
          }
        }
      };
    },
    setupContainer(el: Element): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-container chart-container-doughnut';
      wrapper.style.position = 'relative';
      
      const maxWidth = el.getAttribute('data-max-width') || '400px';
      wrapper.style.maxWidth = maxWidth;
      wrapper.style.margin = '0 auto';
      
      const height = el.getAttribute('data-height') || '400px';
      wrapper.style.height = height;
      
      return wrapper;
    }
  },
  
  'chart-radar': {
    extractConfig(el: Element): ChartConfig {
      const baseConfig = extractBaseConfig(el);
      const beginAtZero = el.getAttribute('data-begin-at-zero') !== 'false';
      
      return {
        type: 'radar',
        data: baseConfig.data || { datasets: [] },
        options: {
          ...baseConfig.options,
          elements: {
            line: {
              borderWidth: 3
            },
            point: {
              radius: 4,
              hoverRadius: 6
            }
          },
          scales: {
            r: {
              beginAtZero,
              grid: {
                circular: true
              }
            }
          }
        }
      };
    },
    setupContainer(el: Element): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-container chart-container-radar';
      wrapper.style.position = 'relative';
      
      const maxWidth = el.getAttribute('data-max-width') || '500px';
      wrapper.style.maxWidth = maxWidth;
      wrapper.style.margin = '0 auto';
      
      const height = el.getAttribute('data-height') || '400px';
      wrapper.style.height = height;
      
      return wrapper;
    }
  },
  
  'chart-polar': {
    extractConfig(el: Element): ChartConfig {
      const baseConfig = extractBaseConfig(el);
      
      return {
        type: 'polarArea',
        data: baseConfig.data || { datasets: [] },
        options: {
          ...baseConfig.options,
          scales: {
            r: {
              beginAtZero: true
            }
          }
        }
      };
    },
    setupContainer(el: Element): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-container chart-container-polar';
      wrapper.style.position = 'relative';
      
      const maxWidth = el.getAttribute('data-max-width') || '400px';
      wrapper.style.maxWidth = maxWidth;
      wrapper.style.margin = '0 auto';
      
      const height = el.getAttribute('data-height') || '400px';
      wrapper.style.height = height;
      
      return wrapper;
    }
  },
  
  'chart-bubble': {
    extractConfig(el: Element): ChartConfig {
      const baseConfig = extractBaseConfig(el);
      
      return {
        type: 'bubble',
        data: baseConfig.data || { datasets: [] },
        options: {
          ...baseConfig.options,
          scales: {
            x: {
              beginAtZero: true
            },
            y: {
              beginAtZero: true
            }
          }
        }
      };
    },
    setupContainer(el: Element): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-container chart-container-bubble';
      wrapper.style.position = 'relative';
      
      const width = el.getAttribute('data-width') || '100%';
      const height = el.getAttribute('data-height') || '400px';
      
      wrapper.style.width = width;
      wrapper.style.height = height;
      
      return wrapper;
    }
  },
  
  'chart-scatter': {
    extractConfig(el: Element): ChartConfig {
      const baseConfig = extractBaseConfig(el);
      const beginAtZero = el.getAttribute('data-begin-at-zero') !== 'false';
      
      return {
        type: 'scatter',
        data: baseConfig.data || { datasets: [] },
        options: {
          ...baseConfig.options,
          scales: {
            x: {
              type: 'linear' as const,
              position: 'bottom' as const
            },
            y: {
              beginAtZero
            }
          }
        }
      };
    },
    setupContainer(el: Element): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-container chart-container-scatter';
      wrapper.style.position = 'relative';
      
      const width = el.getAttribute('data-width') || '100%';
      const height = el.getAttribute('data-height') || '400px';
      
      wrapper.style.width = width;
      wrapper.style.height = height;
      
      return wrapper;
    }
  },
  
  'chart-area': {
    extractConfig(el: Element): ChartConfig {
      const baseConfig = extractBaseConfig(el);
      
      // Area chart는 line chart에 fill 옵션 추가
      if (baseConfig.data?.datasets) {
        baseConfig.data.datasets.forEach(dataset => {
          dataset.fill = dataset.fill !== undefined ? dataset.fill : true;
          dataset.tension = dataset.tension !== undefined ? dataset.tension : 0.4;
        });
      }
      
      return {
        type: 'line',
        data: baseConfig.data || { datasets: [] },
        options: {
          ...baseConfig.options,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      };
    },
    setupContainer(el: Element): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-container chart-container-area';
      wrapper.style.position = 'relative';
      
      const width = el.getAttribute('data-width') || '100%';
      const height = el.getAttribute('data-height') || '400px';
      
      wrapper.style.width = width;
      wrapper.style.height = height;
      
      return wrapper;
    }
  }
};

/**
 * 기본 변환 규칙 (알 수 없는 차트 타입용)
 */
export const defaultChartTransform: ChartTransform = {
  extractConfig(el: Element): ChartConfig {
    const baseConfig = extractBaseConfig(el);
    const typeAttr = el.getAttribute('data-type') || 'line';
    
    return {
      type: typeAttr as any,
      data: baseConfig.data || { datasets: [] },
      options: baseConfig.options || {}
    };
  },
  setupContainer(el: Element): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-container chart-container-custom';
    wrapper.style.position = 'relative';
    
    const width = el.getAttribute('data-width') || '100%';
    const height = el.getAttribute('data-height') || '400px';
    
    wrapper.style.width = width;
    wrapper.style.height = height;
    
    return wrapper;
  }
};