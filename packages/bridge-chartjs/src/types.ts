// src/types.ts - Chart.js 타입 정의
import type { 
  Chart as ChartJS, 
  ChartConfiguration, 
  ChartType,
  ChartData as ChartJSData,
  ChartOptions as ChartJSOptions,
  ChartDataset,
  Point,
  BubbleDataPoint
} from 'chart.js';

/**
 * Chart.js의 Chart 타입을 재export
 */
export type Chart = ChartJS;

/**
 * ChartConfiguration 타입 재export
 */
export type { ChartConfiguration, ChartType };

/**
 * 캔버스 요소 확장 (차트 인스턴스 저장)
 */
export interface ChartElement extends HTMLCanvasElement {
  chart?: Chart;
  chartConfig?: ChartConfiguration;
  chartType?: ChartType;
}

/**
 * 간소화된 차트 데이터 인터페이스
 */
export interface ChartData {
  labels?: string[] | number[] | Date[];
  datasets: Array<{
    label?: string;
    data: any[];  // 모든 데이터 타입 허용
    backgroundColor?: string | string[] | CanvasGradient | CanvasPattern;
    borderColor?: string | string[] | CanvasGradient | CanvasPattern;
    borderWidth?: number | number[];
    fill?: boolean | string | number | { target: string | number };
    tension?: number;
    pointRadius?: number | number[];
    pointHoverRadius?: number | number[];
    pointStyle?: string | HTMLImageElement | HTMLCanvasElement;
    type?: ChartType;  // 혼합 차트용
    yAxisID?: string;
    xAxisID?: string;
    stack?: string;
    hidden?: boolean;
    order?: number;
    [key: string]: any;  // 추가 속성 허용
  }>;
}

/**
 * 간소화된 차트 옵션 인터페이스
 */
export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
  indexAxis?: 'x' | 'y';
  cutout?: string | number;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
      align?: 'start' | 'center' | 'end';
      labels?: {
        color?: string;
        font?: {
          size?: number;
          family?: string;
          weight?: string;
        };
      };
    };
    title?: {
      display?: boolean;
      text?: string;
      color?: string;
      font?: {
        size?: number;
        family?: string;
        weight?: string;
      };
      padding?: number | {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
      };
    };
    tooltip?: {
      enabled?: boolean;
      mode?: 'point' | 'nearest' | 'index' | 'dataset' | 'x' | 'y';
      intersect?: boolean;
      backgroundColor?: string;
      titleColor?: string;
      bodyColor?: string;
      borderColor?: string;
      borderWidth?: number;
      callbacks?: {
        [key: string]: any;
      };
    };
    datalabels?: {
      display?: boolean | string | ((context: any) => boolean);
      color?: string | ((context: any) => string);
      font?: {
        size?: number;
        weight?: string;
      };
      formatter?: (value: any, context: any) => string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  scales?: {
    x?: {
      display?: boolean;
      type?: 'category' | 'linear' | 'logarithmic' | 'time' | 'timeseries';
      stacked?: boolean;
      beginAtZero?: boolean;
      grid?: {
        display?: boolean;
        color?: string;
        lineWidth?: number;
      };
      ticks?: {
        color?: string;
        font?: {
          size?: number;
          family?: string;
        };
        callback?: (value: any, index: number, values: any[]) => string;
      };
      title?: {
        display?: boolean;
        text?: string;
        color?: string;
        font?: {
          size?: number;
          family?: string;
          weight?: string;
        };
      };
      [key: string]: any;
    };
    y?: {
      display?: boolean;
      type?: 'category' | 'linear' | 'logarithmic';
      stacked?: boolean;
      beginAtZero?: boolean;
      grid?: {
        display?: boolean;
        color?: string;
        lineWidth?: number;
      };
      ticks?: {
        color?: string;
        font?: {
          size?: number;
          family?: string;
        };
        callback?: (value: any, index: number, values: any[]) => string;
      };
      title?: {
        display?: boolean;
        text?: string;
        color?: string;
        font?: {
          size?: number;
          family?: string;
          weight?: string;
        };
      };
      [key: string]: any;
    };
    r?: {
      beginAtZero?: boolean;
      grid?: {
        circular?: boolean;
        color?: string;
      };
      [key: string]: any;
    };
    [key: string]: any;
  };
  animation?: {
    duration?: number;
    easing?: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 
             'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' |
             'easeInQuart' | 'easeOutQuart' | 'easeInOutQuart' |
             'easeInQuint' | 'easeOutQuint' | 'easeInOutQuint' |
             'easeInSine' | 'easeOutSine' | 'easeInOutSine' |
             'easeInExpo' | 'easeOutExpo' | 'easeInOutExpo' |
             'easeInCirc' | 'easeOutCirc' | 'easeInOutCirc' |
             'easeInElastic' | 'easeOutElastic' | 'easeInOutElastic' |
             'easeInBack' | 'easeOutBack' | 'easeInOutBack' |
             'easeInBounce' | 'easeOutBounce' | 'easeInOutBounce';
    animateRotate?: boolean;
    animateScale?: boolean;
    onProgress?: (animation: any) => void;
    onComplete?: (animation: any) => void;
  };
  interaction?: {
    mode?: 'point' | 'nearest' | 'index' | 'dataset' | 'x' | 'y';
    intersect?: boolean;
    axis?: 'x' | 'y' | 'xy' | 'r';
  };
  elements?: {
    point?: {
      radius?: number;
      hoverRadius?: number;
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
    };
    line?: {
      tension?: number;
      borderWidth?: number;
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean | string;
    };
    arc?: {
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
    };
    bar?: {
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      borderRadius?: number;
    };
  };
  layout?: {
    padding?: number | {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  };
  [key: string]: any;
}

/**
 * 차트 설정 인터페이스
 */
export interface ChartConfig {
  type: ChartType;
  data: ChartData;
  options?: ChartOptions;
}

/**
 * 차트 업데이트 모드
 */
export type ChartUpdateMode = 'none' | 'hide' | 'show' | 'default' | 'active' | 'resize' | 'reset';

/**
 * 차트 Export 형식
 */
export type ChartExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf';

/**
 * 실시간 차트 설정
 */
export interface RealtimeChartConfig {
  delay?: number;           // 업데이트 지연 (ms)
  duration?: number;         // 애니메이션 지속 시간 (ms)
  refresh?: number;          // 새로고침 간격 (ms)
  frameRate?: number;        // 프레임 레이트
  pause?: boolean;           // 일시 정지 상태
  ttl?: number | {         // 데이터 생존 시간
    data?: number;
    labels?: number;
  };
  onRefresh?: (chart: Chart) => void;  // 새로고침 콜백
}

/**
 * 차트 테마 설정
 */
export interface ChartTheme {
  name: string;
  colors: string[];
  font?: {
    family?: string;
    size?: number;
    color?: string;
  };
  grid?: {
    color?: string;
    lineWidth?: number;
  };
  background?: string;
  [key: string]: any;
}

/**
 * 차트 상호작용 이벤트
 */
export interface ChartEvent {
  type: 'click' | 'hover' | 'mousemove' | 'mouseout' | 'resize';
  native?: Event;
  x?: number;
  y?: number;
  datasetIndex?: number;
  index?: number;
  value?: any;
}

/**
 * 차트 플러그인 인터페이스
 */
export interface ChartPlugin {
  id: string;
  beforeInit?: (chart: Chart, args: any, options: any) => void;
  afterInit?: (chart: Chart, args: any, options: any) => void;
  beforeUpdate?: (chart: Chart, args: any, options: any) => void;
  afterUpdate?: (chart: Chart, args: any, options: any) => void;
  beforeDraw?: (chart: Chart, args: any, options: any) => void;
  afterDraw?: (chart: Chart, args: any, options: any) => void;
  beforeDatasetsDraw?: (chart: Chart, args: any, options: any) => void;
  afterDatasetsDraw?: (chart: Chart, args: any, options: any) => void;
  beforeDestroy?: (chart: Chart, args: any, options: any) => void;
  afterDestroy?: (chart: Chart, args: any, options: any) => void;
  [key: string]: any;
}

/**
 * 차트 애니메이션 설정
 */
export interface ChartAnimation {
  duration?: number;
  easing?: string;
  delay?: number | ((context: any) => number);
  loop?: boolean;
  animateRotate?: boolean;
  animateScale?: boolean;
}

/**
 * 차트 범례 아이템
 */
export interface ChartLegendItem {
  text: string;
  fillStyle?: string;
  strokeStyle?: string;
  lineWidth?: number;
  hidden?: boolean;
  index?: number;
  datasetIndex?: number;
  fontColor?: string;
  fontStyle?: string;
  lineCap?: CanvasLineCap;
  lineDash?: number[];
  lineDashOffset?: number;
  lineJoin?: CanvasLineJoin;
  pointStyle?: string | HTMLImageElement | HTMLCanvasElement;
  rotation?: number;
}

/**
 * 차트 툴팁 아이템
 */
export interface ChartTooltipItem {
  label?: string;
  value?: string | number;
  formattedValue?: string;
  dataset?: ChartDataset;
  datasetIndex?: number;
  dataIndex?: number;
  element?: any;
}

/**
 * 차트 데이터 포인트
 */
export interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  r?: number;  // bubble charts
  [key: string]: any;
}