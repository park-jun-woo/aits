/**
 * =================================================================
 * Ionic.ts - Ionic Framework 웹 컴포넌트 브리지
 * =================================================================
 * @description
 * - Ionic Framework 컴포넌트를 AITS에서 사용할 수 있도록 브리지
 * - is="ion-*" 패턴을 <ion-*>로 자동 변환
 * - iOS/Android 네이티브 스타일 UI 지원
 * @author Aits Framework AI
 * @version 1.0.0
 * @see https://ionicframework.com/
 */

import { Bridge, BridgeConfig, ComponentTransform, ComponentTransformMap } from '../Bridge';

// Ionic 컴포넌트 인터페이스 정의
interface IonButton extends HTMLElement {
    color?: string;
    expand?: 'block' | 'full';
    fill?: 'clear' | 'default' | 'outline' | 'solid';
    mode?: 'ios' | 'md';
    shape?: 'round';
    size?: 'small' | 'default' | 'large';
    strong?: boolean;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    href?: string;
    routerDirection?: 'back' | 'forward' | 'root';
}

interface IonInput extends HTMLElement {
    accept?: string;
    autocapitalize?: string;
    autocomplete?: string;
    autocorrect?: string;
    autofocus?: boolean;
    clearInput?: boolean;
    clearOnEdit?: boolean;
    color?: string;
    debounce?: number;
    disabled?: boolean;
    enterkeyhint?: string;
    inputmode?: string;
    max?: string;
    maxlength?: number;
    min?: string;
    minlength?: number;
    mode?: 'ios' | 'md';
    multiple?: boolean;
    name?: string;
    pattern?: string;
    placeholder?: string;
    readonly?: boolean;
    required?: boolean;
    size?: number;
    spellcheck?: boolean;
    step?: string;
    type?: string;
    value?: string | number;
}

interface IonModal extends HTMLElement {
    animated?: boolean;
    backdropDismiss?: boolean;
    canDismiss?: boolean | (() => Promise<boolean>);
    cssClass?: string | string[];
    enterAnimation?: any;
    handle?: boolean;
    handleBehavior?: 'none' | 'cycle' | 'drag';
    initialBreakpoint?: number;
    isOpen?: boolean;
    keepContentsMounted?: boolean;
    keyboardClose?: boolean;
    leaveAnimation?: any;
    mode?: 'ios' | 'md';
    presentingElement?: HTMLElement;
    showBackdrop?: boolean;
    translucent?: boolean;
    trigger?: string;
    present(): Promise<void>;
    dismiss(data?: any, role?: string): Promise<boolean>;
    onDidDismiss(): Promise<any>;
    onWillDismiss(): Promise<any>;
}

interface IonToast extends HTMLElement {
    animated?: boolean;
    buttons?: any[];
    color?: string;
    cssClass?: string | string[];
    duration?: number;
    enterAnimation?: any;
    header?: string;
    htmlAttributes?: any;
    icon?: string;
    isOpen?: boolean;
    keyboardClose?: boolean;
    layout?: 'baseline' | 'stacked';
    leaveAnimation?: any;
    message?: string;
    mode?: 'ios' | 'md';
    position?: 'top' | 'bottom' | 'middle';
    positionAnchor?: string | HTMLElement;
    swipeGesture?: 'vertical';
    translucent?: boolean;
    trigger?: string;
    present(): Promise<void>;
    dismiss(data?: any, role?: string): Promise<boolean>;
}

interface IonLoading extends HTMLElement {
    animated?: boolean;
    backdropDismiss?: boolean;
    cssClass?: string | string[];
    duration?: number;
    enterAnimation?: any;
    htmlAttributes?: any;
    isOpen?: boolean;
    keyboardClose?: boolean;
    leaveAnimation?: any;
    message?: string;
    mode?: 'ios' | 'md';
    showBackdrop?: boolean;
    spinner?: string;
    translucent?: boolean;
    trigger?: string;
    present(): Promise<void>;
    dismiss(data?: any, role?: string): Promise<boolean>;
}

// Ionic 컴포넌트 타입 정의
export type IonicComponent = 
    // 버튼 & 액션
    | 'ion-button' | 'ion-fab' | 'ion-fab-button' | 'ion-fab-list'
    | 'ion-back-button' | 'ion-menu-button' | 'ion-menu-toggle'
    
    // 입력
    | 'ion-input' | 'ion-textarea' | 'ion-searchbar' | 'ion-segment'
    | 'ion-segment-button' | 'ion-checkbox' | 'ion-radio' | 'ion-radio-group'
    | 'ion-range' | 'ion-select' | 'ion-select-option' | 'ion-toggle'
    | 'ion-datetime' | 'ion-datetime-button' | 'ion-picker'
    
    // 데이터 표시
    | 'ion-card' | 'ion-card-header' | 'ion-card-title' | 'ion-card-subtitle'
    | 'ion-card-content' | 'ion-item' | 'ion-label' | 'ion-note'
    | 'ion-badge' | 'ion-thumbnail' | 'ion-avatar' | 'ion-img'
    | 'ion-chip' | 'ion-icon'
    
    // 리스트 & 그리드
    | 'ion-list' | 'ion-list-header' | 'ion-item-divider'
    | 'ion-item-group' | 'ion-item-sliding' | 'ion-item-options'
    | 'ion-item-option' | 'ion-virtual-scroll' | 'ion-infinite-scroll'
    | 'ion-infinite-scroll-content' | 'ion-reorder' | 'ion-reorder-group'
    | 'ion-grid' | 'ion-row' | 'ion-col'
    
    // 네비게이션
    | 'ion-tabs' | 'ion-tab' | 'ion-tab-bar' | 'ion-tab-button'
    | 'ion-nav' | 'ion-nav-link' | 'ion-breadcrumb' | 'ion-breadcrumbs'
    | 'ion-menu' | 'ion-split-pane' | 'ion-accordion' | 'ion-accordion-group'
    
    // 모달 & 오버레이
    | 'ion-modal' | 'ion-popover' | 'ion-action-sheet' | 'ion-alert'
    | 'ion-loading' | 'ion-toast' | 'ion-picker' | 'ion-backdrop'
    
    // 레이아웃
    | 'ion-app' | 'ion-header' | 'ion-footer' | 'ion-title' | 'ion-toolbar'
    | 'ion-buttons' | 'ion-content' | 'ion-refresher' | 'ion-refresher-content'
    
    // 진행 표시
    | 'ion-progress-bar' | 'ion-skeleton-text' | 'ion-spinner'
    
    // 유틸리티
    | 'ion-text' | 'ion-ripple-effect';

/**
 * Ionic Framework 브리지
 */
export class IonicBridge extends Bridge {
    private static instance: IonicBridge | null = null;
    private ionicLoaded: boolean = false;
    
    constructor() {
        const transformations = new Map<string, ComponentTransform>();
        
        // 각 컴포넌트별 변환 규칙 설정
        
        // 버튼 변환 규칙
        transformations.set('ion-button', {
            attributes: {
                remove: ['is'],
                transform: {
                    'variant': (value: string) => {
                        // AITS variant를 Ionic fill로 매핑
                        const fillMap: Record<string, string> = {
                            'primary': 'solid',
                            'secondary': 'outline',
                            'success': 'solid',
                            'warning': 'solid',
                            'danger': 'solid',
                            'neutral': 'clear'
                        };
                        return fillMap[value] || value;
                    },
                    'size': (value: string) => {
                        // AITS size를 Ionic size로 매핑
                        const sizeMap: Record<string, string> = {
                            'small': 'small',
                            'medium': 'default',
                            'large': 'large'
                        };
                        return sizeMap[value] || value;
                    }
                }
            },
            events: {
                wrap: true,
                rename: {
                    'click': 'ionClick'
                }
            }
        });
        
        // 입력 필드 변환 규칙
        transformations.set('ion-input', {
            attributes: {
                remove: ['is'],
                rename: {
                    'helper': 'helper-text',
                    'error': 'error-text'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'ionChange',
                    'input': 'ionInput',
                    'blur': 'ionBlur',
                    'focus': 'ionFocus'
                }
            }
        });
        
        // 텍스트 영역 변환 규칙
        transformations.set('ion-textarea', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'ionChange',
                    'input': 'ionInput'
                }
            }
        });
        
        // 체크박스 변환 규칙
        transformations.set('ion-checkbox', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'ionChange'
                }
            }
        });
        
        // 라디오 변환 규칙
        transformations.set('ion-radio', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'ionChange'
                }
            }
        });
        
        // 토글 스위치 변환 규칙
        transformations.set('ion-toggle', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'ionChange'
                }
            }
        });
        
        // 셀렉트 변환 규칙
        transformations.set('ion-select', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'ionChange',
                    'cancel': 'ionCancel'
                }
            }
        });
        
        // 레인지 슬라이더 변환 규칙
        transformations.set('ion-range', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'ionChange',
                    'input': 'ionInput'
                }
            }
        });
        
        // 날짜 선택기 변환 규칙
        transformations.set('ion-datetime', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'ionChange',
                    'cancel': 'ionCancel'
                }
            }
        });
        
        // 검색바 변환 규칙
        transformations.set('ion-searchbar', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'input': 'ionInput',
                    'change': 'ionChange',
                    'clear': 'ionClear',
                    'cancel': 'ionCancel'
                }
            }
        });
        
        // 카드 변환 규칙
        transformations.set('ion-card', {
            attributes: {
                remove: ['is']
            },
            slots: {
                rename: {
                    'header': 'header',
                    'content': 'content'
                }
            }
        });
        
        // 모달 변환 규칙
        transformations.set('ion-modal', {
            attributes: {
                remove: ['is'],
                rename: {
                    'open': 'is-open'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'open': 'ionModalDidPresent',
                    'close': 'ionModalDidDismiss'
                }
            }
        });
        
        // 토스트 변환 규칙
        transformations.set('ion-toast', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'open': 'ionToastDidPresent',
                    'close': 'ionToastDidDismiss'
                }
            }
        });
        
        // 로딩 변환 규칙
        transformations.set('ion-loading', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'open': 'ionLoadingDidPresent',
                    'close': 'ionLoadingDidDismiss'
                }
            }
        });
        
        // 탭 변환 규칙
        transformations.set('ion-tabs', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'ionTabsDidChange'
                }
            }
        });
        
        // 세그먼트 변환 규칙
        transformations.set('ion-segment', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'ionChange'
                }
            }
        });
        
        // 설정 생성
        const config: BridgeConfig = {
            prefix: 'ion',
            library: 'Ionic Framework',
            version: '7.6.0',
            cdnUrl: 'https://cdn.jsdelivr.net/npm/@ionic/core@7.6.0',
            loadStrategy: 'lazy',
            transformations
        };
        
        super(config);
    }
    
    /**
     * 싱글톤 인스턴스 가져오기
     */
    static getInstance(): IonicBridge {
        if (!this.instance) {
            this.instance = new IonicBridge();
        }
        return this.instance;
    }
    
    /**
     * Ionic 라이브러리 로드
     */
    protected async performLoad(): Promise<void> {
        if (this.ionicLoaded) return;
        
        console.log('[IonicBridge] Loading Ionic Framework...');
        
        // 이미 로드되었는지 확인
        if ((window as any).Ionic) {
            this.ionicLoaded = true;
            return;
        }
        
        // Ionic 스타일시트 로드
        await this.loadStylesheet();
        
        // Ionic 스크립트 로드
        await this.loadScript();
        
        // 테마 설정
        this.setupTheme();
        
        // Ionic 초기화
        await this.initializeIonic();
        
        this.ionicLoaded = true;
        console.log('[IonicBridge] Ionic Framework loaded successfully');
    }
    
    /**
     * Ionic 스타일시트 로드
     */
    private async loadStylesheet(): Promise<void> {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${this.config.cdnUrl}/css/ionic.bundle.css`;
        
        return new Promise((resolve, reject) => {
            link.onload = () => resolve();
            link.onerror = () => reject(new Error('Failed to load Ionic stylesheet'));
            document.head.appendChild(link);
        });
    }
    
    /**
     * Ionic 스크립트 로드
     */
    private async loadScript(): Promise<void> {
        // Ionic Core 로드
        const coreScript = document.createElement('script');
        coreScript.type = 'module';
        coreScript.src = `${this.config.cdnUrl}/dist/ionic/ionic.esm.js`;
        
        // Ionic Loader 로드
        const loaderScript = document.createElement('script');
        loaderScript.noModule = true;
        loaderScript.src = `${this.config.cdnUrl}/dist/ionic/ionic.js`;
        
        return new Promise((resolve, reject) => {
            let loaded = 0;
            const checkLoaded = () => {
                loaded++;
                if (loaded === 2) resolve();
            };
            
            coreScript.onload = checkLoaded;
            loaderScript.onload = checkLoaded;
            
            coreScript.onerror = () => reject(new Error('Failed to load Ionic core'));
            loaderScript.onerror = () => reject(new Error('Failed to load Ionic loader'));
            
            document.head.appendChild(coreScript);
            document.head.appendChild(loaderScript);
        });
    }
    
    /**
     * Ionic 초기화
     */
    private async initializeIonic(): Promise<void> {
        // Ionic이 로드될 때까지 대기
        return new Promise((resolve) => {
            const checkIonic = () => {
                if ((window as any).Ionic) {
                    resolve();
                } else {
                    setTimeout(checkIonic, 50);
                }
            };
            checkIonic();
        });
    }
    
    /**
     * 테마 설정
     */
    private setupTheme(): void {
        // CSS 변수를 통한 테마 커스터마이징
        const style = document.createElement('style');
        style.textContent = `
            :root {
                /* Ionic 색상 변수를 AITS 변수와 연결 */
                --ion-color-primary: var(--aits-color-primary, #3880ff);
                --ion-color-primary-rgb: var(--aits-color-primary-rgb, 56, 128, 255);
                --ion-color-primary-contrast: var(--aits-color-primary-contrast, #ffffff);
                --ion-color-primary-contrast-rgb: var(--aits-color-primary-contrast-rgb, 255, 255, 255);
                --ion-color-primary-shade: var(--aits-color-primary-shade, #3171e0);
                --ion-color-primary-tint: var(--aits-color-primary-tint, #4c8dff);
                
                --ion-color-secondary: var(--aits-color-secondary, #3dc2ff);
                --ion-color-tertiary: var(--aits-color-tertiary, #5260ff);
                --ion-color-success: var(--aits-color-success, #2dd36f);
                --ion-color-warning: var(--aits-color-warning, #ffc409);
                --ion-color-danger: var(--aits-color-danger, #eb445a);
                --ion-color-light: var(--aits-color-light, #f4f5f8);
                --ion-color-medium: var(--aits-color-medium, #92949c);
                --ion-color-dark: var(--aits-color-dark, #222428);
                
                /* 레이아웃 변수 */
                --ion-padding: var(--aits-spacing-md, 16px);
                --ion-margin: var(--aits-spacing-md, 16px);
                
                /* 텍스트 */
                --ion-font-family: var(--aits-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
            }
            
            /* iOS와 Material Design 모드 지원 */
            .ios body {
                --ion-font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Roboto", sans-serif;
            }
            
            .md body {
                --ion-font-family: "Roboto", "Helvetica Neue", sans-serif;
            }
            
            /* 다크 모드 지원 */
            @media (prefers-color-scheme: dark) {
                :root {
                    --ion-color-primary: var(--aits-color-primary-dark, #428cff);
                    --ion-color-secondary: var(--aits-color-secondary-dark, #50c8ff);
                    --ion-color-tertiary: var(--aits-color-tertiary-dark, #6a64ff);
                    --ion-color-success: var(--aits-color-success-dark, #2fdf75);
                    --ion-color-warning: var(--aits-color-warning-dark, #ffd534);
                    --ion-color-danger: var(--aits-color-danger-dark, #ff4961);
                    --ion-color-light: var(--aits-color-light-dark, #222428);
                    --ion-color-medium: var(--aits-color-medium-dark, #989aa2);
                    --ion-color-dark: var(--aits-color-dark-dark, #f4f5f8);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 컴포넌트별 특수 처리
     */
    protected createElement(componentName: string): HTMLElement | null {
        const element = super.createElement(componentName);
        
        if (!element) return null;
        
        // 컴포넌트별 초기화
        switch (componentName) {
            case 'ion-app':
                // ion-app은 최상위 요소
                if (!document.querySelector('ion-app')) {
                    document.body.appendChild(element);
                }
                break;
                
            case 'ion-modal':
            case 'ion-popover':
            case 'ion-alert':
            case 'ion-loading':
            case 'ion-toast':
            case 'ion-action-sheet':
            case 'ion-picker':
                // 오버레이 컴포넌트는 body에 추가
                document.body.appendChild(element);
                break;
        }
        
        return element;
    }
    
    /**
     * 특수 속성 처리
     */
    protected copyAttributes(
        source: HTMLElement, 
        target: HTMLElement, 
        transform?: ComponentTransform
    ): void {
        super.copyAttributes(source, target, transform);
        
        // Ionic 특수 속성 처리
        const componentName = target.tagName.toLowerCase();
        
        // 플랫폼별 모드 설정
        const mode = this.detectMode();
        if (!target.hasAttribute('mode')) {
            target.setAttribute('mode', mode);
        }
        
        // 색상 속성 처리
        if (source.hasAttribute('variant')) {
            const variant = source.getAttribute('variant');
            const colorMap: Record<string, string> = {
                'primary': 'primary',
                'secondary': 'secondary',
                'success': 'success',
                'warning': 'warning',
                'danger': 'danger',
                'neutral': 'medium'
            };
            const color = colorMap[variant!] || variant;
            target.setAttribute('color', color!);
        }
    }
    
    /**
     * 플랫폼 감지
     */
    private detectMode(): 'ios' | 'md' {
        const userAgent = navigator.userAgent;
        
        // iOS 감지
        if (/iPad|iPhone|iPod/.test(userAgent)) {
            return 'ios';
        }
        
        // 기본값은 Material Design
        return 'md';
    }
    
    /**
     * Ionic 컴포넌트 헬퍼 메서드
     */
    
    /**
     * 토스트 표시
     */
    static async presentToast(options: {
        message: string;
        duration?: number;
        position?: 'top' | 'bottom' | 'middle';
        color?: string;
        buttons?: any[];
    }): Promise<IonToast> {
        const bridge = IonicBridge.getInstance();
        await bridge.load();
        
        const toast = document.createElement('ion-toast') as IonToast;
        toast.message = options.message;
        toast.duration = options.duration || 2000;
        toast.position = options.position || 'bottom';
        if (options.color) toast.color = options.color;
        if (options.buttons) toast.buttons = options.buttons;
        
        document.body.appendChild(toast);
        await toast.present();
        
        return toast;
    }
    
    /**
     * 로딩 표시
     */
    static async presentLoading(options: {
        message?: string;
        duration?: number;
        spinner?: string;
    } = {}): Promise<IonLoading> {
        const bridge = IonicBridge.getInstance();
        await bridge.load();
        
        const loading = document.createElement('ion-loading') as IonLoading;
        if (options.message) loading.message = options.message;
        if (options.duration) loading.duration = options.duration;
        if (options.spinner) loading.spinner = options.spinner;
        
        document.body.appendChild(loading);
        await loading.present();
        
        return loading;
    }
    
    /**
     * 모달 생성
     */
    static async createModal(options: {
        component: string | HTMLElement;
        componentProps?: any;
        presentingElement?: HTMLElement;
        canDismiss?: boolean;
        breakpoints?: number[];
        initialBreakpoint?: number;
    }): Promise<IonModal> {
        const bridge = IonicBridge.getInstance();
        await bridge.load();
        
        const modal = document.createElement('ion-modal') as IonModal;
        
        // 컴포넌트 설정
        if (typeof options.component === 'string') {
            modal.innerHTML = options.component;
        } else {
            modal.appendChild(options.component);
        }
        
        // 속성 설정
        if (options.presentingElement) modal.presentingElement = options.presentingElement;
        if (options.canDismiss !== undefined) modal.canDismiss = options.canDismiss;
        if (options.initialBreakpoint) modal.initialBreakpoint = options.initialBreakpoint;
        
        document.body.appendChild(modal);
        
        return modal;
    }
    
    /**
     * 액션 시트 표시
     */
    static async presentActionSheet(options: {
        header?: string;
        subHeader?: string;
        buttons: Array<{
            text: string;
            role?: string;
            icon?: string;
            handler?: () => void;
        }>;
    }): Promise<HTMLElement> {
        const bridge = IonicBridge.getInstance();
        await bridge.load();
        
        const actionSheet = document.createElement('ion-action-sheet');
        
        // 옵션 설정
        (actionSheet as any).header = options.header;
        (actionSheet as any).subHeader = options.subHeader;
        (actionSheet as any).buttons = options.buttons;
        
        document.body.appendChild(actionSheet);
        await (actionSheet as any).present();
        
        return actionSheet;
    }
    
    /**
     * 알림 표시
     */
    static async presentAlert(options: {
        header?: string;
        subHeader?: string;
        message?: string;
        buttons?: string[] | any[];
        inputs?: any[];
    }): Promise<HTMLElement> {
        const bridge = IonicBridge.getInstance();
        await bridge.load();
        
        const alert = document.createElement('ion-alert');
        
        // 옵션 설정
        (alert as any).header = options.header;
        (alert as any).subHeader = options.subHeader;
        (alert as any).message = options.message;
        (alert as any).buttons = options.buttons || ['OK'];
        if (options.inputs) (alert as any).inputs = options.inputs;
        
        document.body.appendChild(alert);
        await (alert as any).present();
        
        return alert;
    }
    
    /**
     * 플랫폼별 스타일 적용
     */
    static setPlatform(platform: 'ios' | 'md'): void {
        document.documentElement.classList.remove('ios', 'md');
        document.documentElement.classList.add(platform);
        
        // Ionic Config 설정
        const Ionic = (window as any).Ionic;
        if (Ionic && Ionic.config) {
            Ionic.config.set('mode', platform);
        }
    }
    
    /**
     * 컴포넌트 초기화
     */
    static async init(): Promise<void> {
        const bridge = IonicBridge.getInstance();
        await bridge.load();
        bridge.startAutoTransform();
    }
}

// 자동 초기화 (옵션)
if (typeof window !== 'undefined' && (window as any).autoInitIonic !== false) {
    // DOM 준비 후 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            IonicBridge.init();
        });
    } else {
        IonicBridge.init();
    }
}

// 전역에서 사용할 수 있도록 export
export default IonicBridge;