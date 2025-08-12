/**
 * =================================================================
 * ChartJS.ts - Chart.js 웹 컴포넌트 브리지
 * =================================================================
 * @description
 * - Chart.js를 웹 컴포넌트로 래핑하여 AITS에서 사용할 수 있도록 브리지
 * - is="chart-*" 패턴을 <chart-*>로 자동 변환
 * - 선언적 차트 생성 및 반응형 업데이트 지원
 * @author Aits Framework AI
 * @version 1.0.0
 * @see https://www.chartjs.org/
 */

import { Bridge, BridgeConfig, ComponentTransform, ComponentTransformMap } from '../Bridge';

// Chart.js 타입 정의
interface ChartData {
    labels?: string[];
    datasets: Array<{
        label?: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
        fill?: boolean;
        tension?: number;
        pointRadius?: number;
        pointHoverRadius?: number;
        [key: string]: any;
    }>;
}

interface ChartOptions {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    aspectRatio?: number;
    plugins?: {
        title?: {
            display: boolean;
            text: string;
            position?: 'top' | 'left' | 'bottom' | 'right';
            font?: any;
        };
        legend?: {
            display: boolean;
            position?: 'top' | 'left' | 'bottom' | 'right';
            labels?: any;
        };
        tooltip?: any;  // Chart.js tooltip은 매우 복잡하므로 any 사용
        datalabels?: any;
    };
    scales?: {
        x?: any;
        y?: any;
        [key: string]: any;
    };
    animation?: {
        duration?: number;
        easing?: string;
    };
    [key: string]: any;
}

// Chart 웹 컴포넌트 인터페이스
interface ChartElement extends HTMLElement {
    type: string;
    data: ChartData | string;
    options: ChartOptions | string;
    width?: number;
    height?: number;
    updateChart(): void;
    exportImage(type?: string): string;
    destroy(): void;
}

// Chart.js 컴포넌트 타입
export type ChartJSComponent = 
    | 'chart-line'
    | 'chart-bar'
    | 'chart-pie'
    | 'chart-doughnut'
    | 'chart-radar'
    | 'chart-polar'
    | 'chart-bubble'
    | 'chart-scatter'
    | 'chart-area'
    | 'chart-mixed'
    | 'chart-realtime';

/**
 * Chart.js 웹 컴포넌트 클래스
 */
class ChartWebComponent extends HTMLElement {
    private chart: any = null;
    private canvas: HTMLCanvasElement | null = null;
    private resizeObserver: ResizeObserver | null = null;
    protected _type: string = 'line';  // protected로 변경
    private _data: ChartData = { datasets: [] };
    private _options: ChartOptions = {};
    
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
        this.initChart();
        this.setupResizeObserver();
    }
    
    disconnectedCallback() {
        this.cleanup();
    }
    
    static get observedAttributes() {
        return ['type', 'data', 'options', 'width', 'height', 'theme'];
    }
    
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;
        
        switch (name) {
            case 'type':
                this._type = newValue || 'line';
                this.updateChart();
                break;
            case 'data':
                try {
                    this._data = typeof newValue === 'string' ? JSON.parse(newValue) : this._data;
                    this.updateChart();
                } catch (e) {
                    console.error('[ChartJS] Invalid data:', e);
                }
                break;
            case 'options':
                try {
                    this._options = typeof newValue === 'string' ? JSON.parse(newValue) : this._options;
                    this.updateChart();
                } catch (e) {
                    console.error('[ChartJS] Invalid options:', e);
                }
                break;
            case 'width':
            case 'height':
                this.updateSize();
                break;
            case 'theme':
                this.updateTheme(newValue || 'light');
                break;
        }
    }
    
    private render() {
        if (!this.shadowRoot) return;
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 200px;
                }
                
                .chart-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                
                canvas {
                    max-width: 100%;
                    max-height: 100%;
                }
                
                .chart-loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: var(--chart-text-color, #666);
                }
                
                .chart-error {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: var(--chart-error-color, #f44336);
                    text-align: center;
                    padding: 1rem;
                }
                
                .chart-no-data {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: var(--chart-muted-color, #999);
                    text-align: center;
                }
            </style>
            <div class="chart-container">
                <canvas></canvas>
                <div class="chart-loading" style="display: none;">Loading chart...</div>
                <div class="chart-error" style="display: none;"></div>
                <div class="chart-no-data" style="display: none;">No data available</div>
            </div>
        `;
        
        this.canvas = this.shadowRoot.querySelector('canvas');
    }
    
    private async initChart() {
        if (!this.canvas) return;
        
        try {
            // Chart.js가 로드되었는지 확인
            if (!(window as any).Chart) {
                throw new Error('Chart.js is not loaded');
            }
            
            const Chart = (window as any).Chart;
            
            // 이전 차트 정리
            if (this.chart) {
                this.chart.destroy();
            }
            
            // 데이터 검증
            if (!this._data.datasets || this._data.datasets.length === 0) {
                this.showNoData();
                return;
            }
            
            // 차트 생성
            this.chart = new Chart(this.canvas, {
                type: this._type,
                data: this._data,
                options: this.mergeOptions()
            });
            
            this.hideMessages();
            
        } catch (error) {
            console.error('[ChartJS] Failed to initialize chart:', error);
            this.showError('Failed to load chart');
        }
    }
    
    private mergeOptions(): ChartOptions {
        const defaultOptions: ChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            }
        };
        
        // 테마별 옵션
        const theme = this.getAttribute('theme') || 'light';
        const themeOptions = this.getThemeOptions(theme);
        
        return { ...defaultOptions, ...themeOptions, ...this._options };
    }
    
    private getThemeOptions(theme: string): ChartOptions {
        const isDark = theme === 'dark';
        
        return {
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: isDark ? '#e0e0e0' : '#666'
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: isDark ? '#e0e0e0' : '#666'
                    },
                    grid: {
                        color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: isDark ? '#e0e0e0' : '#666'
                    },
                    grid: {
                        color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        };
    }
    
    private setupResizeObserver() {
        if (!this.canvas) return;
        
        this.resizeObserver = new ResizeObserver(() => {
            if (this.chart) {
                this.chart.resize();
            }
        });
        
        this.resizeObserver.observe(this);
    }
    
    private updateSize() {
        const width = this.getAttribute('width');
        const height = this.getAttribute('height');
        
        if (width) {
            this.style.width = `${width}px`;
        }
        
        if (height) {
            this.style.height = `${height}px`;
        }
        
        if (this.chart) {
            this.chart.resize();
        }
    }
    
    private updateTheme(theme: string) {
        if (this.chart) {
            const themeOptions = this.getThemeOptions(theme);
            this.chart.options = { ...this.chart.options, ...themeOptions };
            this.chart.update();
        }
    }
    
    private showLoading() {
        if (!this.shadowRoot) return;
        this.hideMessages();
        const loading = this.shadowRoot.querySelector('.chart-loading') as HTMLElement;
        if (loading) loading.style.display = 'block';
    }
    
    private showError(message: string) {
        if (!this.shadowRoot) return;
        this.hideMessages();
        const error = this.shadowRoot.querySelector('.chart-error') as HTMLElement;
        if (error) {
            error.textContent = message;
            error.style.display = 'block';
        }
    }
    
    private showNoData() {
        if (!this.shadowRoot) return;
        this.hideMessages();
        const noData = this.shadowRoot.querySelector('.chart-no-data') as HTMLElement;
        if (noData) noData.style.display = 'block';
    }
    
    private hideMessages() {
        if (!this.shadowRoot) return;
        const messages = this.shadowRoot.querySelectorAll('.chart-loading, .chart-error, .chart-no-data');
        messages.forEach(msg => (msg as HTMLElement).style.display = 'none');
    }
    
    private cleanup() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }
    
    // Public API
    
    get type() {
        return this._type;
    }
    
    set type(value: string) {
        this.setAttribute('type', value);
    }
    
    get data() {
        return this._data;
    }
    
    set data(value: ChartData | string) {
        const dataStr = typeof value === 'string' ? value : JSON.stringify(value);
        this.setAttribute('data', dataStr);
    }
    
    get options() {
        return this._options;
    }
    
    set options(value: ChartOptions | string) {
        const optionsStr = typeof value === 'string' ? value : JSON.stringify(value);
        this.setAttribute('options', optionsStr);
    }
    
    public updateChart() {
        if (!this.chart) {
            this.initChart();
        } else {
            this.chart.data = this._data;
            this.chart.options = this.mergeOptions();
            this.chart.update();
        }
    }
    
    public updateData(data: ChartData) {
        this._data = data;
        if (this.chart) {
            this.chart.data = data;
            this.chart.update('active');
        }
    }
    
    public addData(label: string, data: number[]) {
        if (this._data.labels) {
            this._data.labels.push(label);
        }
        
        data.forEach((value, index) => {
            if (this._data.datasets[index]) {
                this._data.datasets[index].data.push(value);
            }
        });
        
        if (this.chart) {
            this.chart.update('active');
        }
    }
    
    public removeData() {
        if (this._data.labels && this._data.labels.length > 0) {
            this._data.labels.pop();
        }
        
        this._data.datasets.forEach(dataset => {
            if (dataset.data.length > 0) {
                dataset.data.pop();
            }
        });
        
        if (this.chart) {
            this.chart.update('active');
        }
    }
    
    public exportImage(type: string = 'png'): string {
        if (!this.canvas) return '';
        return this.canvas.toDataURL(`image/${type}`);
    }
    
    public destroy() {
        this.cleanup();
    }
}

/**
 * Chart.js 브리지 클래스
 */
export class ChartJSBridge extends Bridge {
    private static instance: ChartJSBridge | null = null;
    private chartjsLoaded: boolean = false;
    private componentsRegistered: boolean = false;
    
    constructor() {
        const transformations = new Map<string, ComponentTransform>();
        
        // 모든 차트 타입에 대한 공통 변환 규칙
        const chartTypes = [
            'chart-line', 'chart-bar', 'chart-pie', 'chart-doughnut',
            'chart-radar', 'chart-polar', 'chart-bubble', 'chart-scatter',
            'chart-area', 'chart-mixed', 'chart-realtime'
        ];
        
        chartTypes.forEach(chartType => {
            transformations.set(chartType, {
                attributes: {
                    remove: ['is'],
                    transform: {
                        // 차트 타입 추출 (chart-line -> line)
                        'type': (value: string) => {
                            return value || chartType.replace('chart-', '');
                        }
                    }
                },
                events: {
                    wrap: true
                },
                customTransform: (source: HTMLElement, target: HTMLElement) => {
                    // 자식 요소에서 데이터 추출
                    this.extractDataFromChildren(source, target);
                }
            });
        });
        
        const config: BridgeConfig = {
            prefix: 'chart',
            library: 'Chart.js',
            version: '4.4.1',
            cdnUrl: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1',
            loadStrategy: 'lazy',
            transformations
        };
        
        super(config);
    }
    
    /**
     * 싱글톤 인스턴스 가져오기
     */
    static getInstance(): ChartJSBridge {
        if (!this.instance) {
            this.instance = new ChartJSBridge();
        }
        return this.instance;
    }
    
    /**
     * Chart.js 라이브러리 로드
     */
    protected async performLoad(): Promise<void> {
        if (this.chartjsLoaded) return;
        
        console.log('[ChartJSBridge] Loading Chart.js...');
        
        // 이미 로드되었는지 확인
        if ((window as any).Chart) {
            this.chartjsLoaded = true;
            this.registerComponents();
            return;
        }
        
        // Chart.js 스크립트 로드
        await this.loadChartJS();
        
        // 플러그인 로드 (선택적)
        await this.loadPlugins();
        
        // 웹 컴포넌트 등록
        this.registerComponents();
        
        this.chartjsLoaded = true;
        console.log('[ChartJSBridge] Chart.js loaded successfully');
    }
    
    /**
     * Chart.js 메인 스크립트 로드
     */
    private async loadChartJS(): Promise<void> {
        const script = document.createElement('script');
        script.src = `${this.config.cdnUrl}/dist/chart.umd.js`;
        
        return new Promise((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Chart.js'));
            document.head.appendChild(script);
        });
    }
    
    /**
     * Chart.js 플러그인 로드
     */
    private async loadPlugins(): Promise<void> {
        // 필요한 플러그인 로드
        const plugins: string[] = [
            // 'chartjs-plugin-datalabels',
            // 'chartjs-plugin-zoom',
            // 'chartjs-adapter-date-fns'
        ];
        
        const promises = plugins.map((plugin: string) => {
            const script = document.createElement('script');
            script.src = `https://cdn.jsdelivr.net/npm/${plugin}`;
            
            return new Promise<void>((resolve) => {
                script.onload = () => resolve();
                script.onerror = () => {
                    console.warn(`[ChartJSBridge] Failed to load plugin: ${plugin}`);
                    resolve(); // 플러그인 로드 실패해도 계속 진행
                };
                document.head.appendChild(script);
            });
        });
        
        await Promise.all(promises);
    }
    
    /**
     * 웹 컴포넌트 등록
     */
    private registerComponents(): void {
        if (this.componentsRegistered) return;
        
        // Chart 웹 컴포넌트 등록
        if (!customElements.get('chart-element')) {
            customElements.define('chart-element', ChartWebComponent);
        }
        
        // 각 차트 타입별로 별칭 등록
        const chartTypes = [
            'chart-line', 'chart-bar', 'chart-pie', 'chart-doughnut',
            'chart-radar', 'chart-polar', 'chart-bubble', 'chart-scatter',
            'chart-area', 'chart-mixed', 'chart-realtime'
        ];
        
        chartTypes.forEach(tagName => {
            if (!customElements.get(tagName)) {
                customElements.define(tagName, class extends ChartWebComponent {
                    constructor() {
                        super();
                        this._type = tagName.replace('chart-', '');
                    }
                });
            }
        });
        
        this.componentsRegistered = true;
    }
    
    /**
     * 자식 요소에서 데이터 추출
     */
    private extractDataFromChildren(source: HTMLElement, target: HTMLElement): void {
        // <data> 요소에서 데이터 추출
        const dataElement = source.querySelector('data, script[type="application/json"]');
        if (dataElement) {
            try {
                const data = JSON.parse(dataElement.textContent || '{}');
                target.setAttribute('data', JSON.stringify(data));
            } catch (e) {
                console.error('[ChartJSBridge] Failed to parse data:', e);
            }
        }
        
        // <table> 요소에서 데이터 추출
        const table = source.querySelector('table');
        if (table) {
            const data = this.extractDataFromTable(table);
            target.setAttribute('data', JSON.stringify(data));
        }
        
        // data-* 속성에서 데이터 추출
        const datasets = source.querySelectorAll('[data-dataset]');
        if (datasets.length > 0) {
            const data = this.extractDataFromDatasets(datasets);
            target.setAttribute('data', JSON.stringify(data));
        }
    }
    
    /**
     * 테이블에서 데이터 추출
     */
    private extractDataFromTable(table: Element): ChartData {
        const data: ChartData = {
            labels: [],
            datasets: []
        };
        
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        
        if (!thead || !tbody) return data;
        
        // 헤더에서 라벨 추출
        const headers = Array.from(thead.querySelectorAll('th'));
        const labels = headers.slice(1).map(th => th.textContent?.trim() || '');
        data.labels = labels;
        
        // 본문에서 데이터셋 추출
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length > 0) {
                const label = cells[0].textContent?.trim() || '';
                const values = cells.slice(1).map(cell => 
                    parseFloat(cell.textContent?.trim() || '0')
                );
                
                data.datasets.push({
                    label,
                    data: values,
                    backgroundColor: this.generateColor(data.datasets.length),
                    borderColor: this.generateColor(data.datasets.length, true)
                });
            }
        });
        
        return data;
    }
    
    /**
     * 데이터셋 요소에서 데이터 추출
     */
    private extractDataFromDatasets(datasets: NodeListOf<Element>): ChartData {
        const data: ChartData = {
            labels: [],
            datasets: []
        };
        
        datasets.forEach((dataset, index) => {
            const label = dataset.getAttribute('data-label') || `Dataset ${index + 1}`;
            const values = dataset.getAttribute('data-values')?.split(',').map(v => parseFloat(v.trim())) || [];
            const backgroundColor = dataset.getAttribute('data-background-color') || this.generateColor(index);
            const borderColor = dataset.getAttribute('data-border-color') || this.generateColor(index, true);
            
            data.datasets.push({
                label,
                data: values,
                backgroundColor,
                borderColor
            });
            
            // 라벨 추출 (첫 번째 데이터셋에서만)
            if (index === 0) {
                const labels = dataset.getAttribute('data-labels')?.split(',').map(l => l.trim()) || [];
                data.labels = labels;
            }
        });
        
        return data;
    }
    
    /**
     * 색상 생성
     */
    private generateColor(index: number, solid: boolean = false): string {
        const colors = [
            '54, 162, 235',  // Blue
            '255, 99, 132',  // Red
            '255, 206, 86',  // Yellow
            '75, 192, 192',  // Teal
            '153, 102, 255', // Purple
            '255, 159, 64',  // Orange
            '201, 203, 207', // Grey
            '100, 181, 246', // Light Blue
            '255, 183, 77',  // Amber
            '129, 199, 132'  // Green
        ];
        
        const color = colors[index % colors.length];
        return solid ? `rgb(${color})` : `rgba(${color}, 0.5)`;
    }
    
    /**
     * Chart.js 헬퍼 메서드
     */
    
    /**
     * 간단한 차트 생성
     */
    static async createChart(options: {
        type: string;
        container: HTMLElement;
        data: ChartData;
        options?: ChartOptions;
    }): Promise<ChartElement> {
        const bridge = ChartJSBridge.getInstance();
        await bridge.load();
        
        const chart = document.createElement(`chart-${options.type}`) as ChartElement;
        chart.data = options.data;
        if (options.options) {
            chart.options = options.options;
        }
        
        options.container.appendChild(chart);
        return chart;
    }
    
    /**
     * 실시간 차트 생성
     */
    static async createRealtimeChart(options: {
        container: HTMLElement;
        dataSource: () => Promise<{ label: string; data: number[] }>;
        interval: number;
        maxDataPoints?: number;
    }): Promise<ChartElement> {
        const chart = await this.createChart({
            type: 'line',
            container: options.container,
            data: {
                labels: [],
                datasets: [{
                    label: 'Realtime Data',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        type: 'category'
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // 실시간 업데이트
        const maxPoints = options.maxDataPoints || 20;
        
        setInterval(async () => {
            const newData = await options.dataSource();
            const chartData = chart.data as ChartData;
            
            if (chartData.labels) {
                chartData.labels.push(newData.label);
                if (chartData.labels.length > maxPoints) {
                    chartData.labels.shift();
                }
            }
            
            newData.data.forEach((value, index) => {
                if (chartData.datasets[index]) {
                    chartData.datasets[index].data.push(value);
                    if (chartData.datasets[index].data.length > maxPoints) {
                        chartData.datasets[index].data.shift();
                    }
                }
            });
            
            chart.updateChart();
        }, options.interval);
        
        return chart;
    }
    
    /**
     * 차트 테마 설정
     */
    static setGlobalTheme(theme: 'light' | 'dark'): void {
        if (!(window as any).Chart) return;
        
        const Chart = (window as any).Chart;
        const isDark = theme === 'dark';
        
        // 전역 기본값 설정
        Chart.defaults.color = isDark ? '#e0e0e0' : '#666';
        Chart.defaults.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        Chart.defaults.plugins.legend.labels.color = isDark ? '#e0e0e0' : '#666';
        Chart.defaults.plugins.tooltip.backgroundColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    }
    
    /**
     * 컴포넌트 초기화
     */
    static async init(): Promise<void> {
        const bridge = ChartJSBridge.getInstance();
        await bridge.load();
        bridge.startAutoTransform();
    }
}

// 자동 초기화 (옵션)
if (typeof window !== 'undefined' && (window as any).autoInitChartJS !== false) {
    // DOM 준비 후 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ChartJSBridge.init();
        });
    } else {
        ChartJSBridge.init();
    }
}

// 전역에서 사용할 수 있도록 export
export default ChartJSBridge;