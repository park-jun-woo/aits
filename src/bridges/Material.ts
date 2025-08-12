/**
 * =================================================================
 * Material.ts - Material Web Components 브리지
 * =================================================================
 * @description
 * - Google Material Design 3 웹 컴포넌트를 AITS에서 사용할 수 있도록 브리지
 * - is="md-*" 패턴을 <md-*>로 자동 변환
 * - Material You 디자인 시스템 지원
 * @author Aits Framework AI
 * @version 1.0.0
 * @see https://github.com/material-components/material-web
 */

import { Bridge, BridgeConfig, ComponentTransform, ComponentTransformMap } from '../Bridge';

// Material 컴포넌트 인터페이스 정의
interface MdButton extends HTMLElement {
    variant: 'elevated' | 'filled' | 'filled-tonal' | 'outlined' | 'text';
    disabled: boolean;
    href?: string;
    target?: string;
    type?: 'button' | 'submit' | 'reset';
    value?: string;
    name?: string;
    form?: HTMLFormElement;
}

interface MdDialog extends HTMLElement {
    open: boolean;
    type?: 'alert' | 'confirm';
    noFocusTrap?: boolean;
    show(): void;
    close(returnValue?: string): void;
}

interface MdTextField extends HTMLElement {
    value: string;
    type: string;
    label: string;
    placeholder?: string;
    disabled: boolean;
    required: boolean;
    readonly: boolean;
    error: boolean;
    errorText?: string;
    supportingText?: string;
    prefixText?: string;
    suffixText?: string;
    rows?: number;
    cols?: number;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    pattern?: string;
    multiple?: boolean;
}

interface MdCheckbox extends HTMLElement {
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
    required: boolean;
    value: string;
    name?: string;
}

interface MdRadio extends HTMLElement {
    checked: boolean;
    disabled: boolean;
    value: string;
    name?: string;
}

interface MdSwitch extends HTMLElement {
    selected: boolean;
    disabled: boolean;
    value?: string;
    name?: string;
}

interface MdSlider extends HTMLElement {
    value: number;
    valueStart?: number;
    valueEnd?: number;
    min: number;
    max: number;
    step?: number;
    disabled: boolean;
    labeled?: boolean;
    range?: boolean;
}

interface MdMenu extends HTMLElement {
    open: boolean;
    anchor?: HTMLElement | string;
    positioning?: 'absolute' | 'fixed' | 'relative';
    quick?: boolean;
    show(): void;
    close(): void;
}

interface MdSnackbar extends HTMLElement {
    open: boolean;
    timeoutMs: number;
    closeOnEscape: boolean;
    message?: string;
    action?: string;
    show(): void;
    close(): void;
}

// Material 컴포넌트 타입 정의
export type MaterialComponent = 
    // 버튼
    | 'md-elevated-button' | 'md-filled-button' | 'md-filled-tonal-button' 
    | 'md-outlined-button' | 'md-text-button' | 'md-icon-button'
    | 'md-fab' | 'md-branded-fab'
    
    // 입력
    | 'md-checkbox' | 'md-radio' | 'md-switch' | 'md-slider'
    | 'md-filled-text-field' | 'md-outlined-text-field'
    | 'md-filled-select' | 'md-outlined-select'
    
    // 칩
    | 'md-assist-chip' | 'md-filter-chip' | 'md-input-chip' | 'md-suggestion-chip'
    
    // 다이얼로그 & 시트
    | 'md-dialog' | 'md-sheet'
    
    // 리스트
    | 'md-list' | 'md-list-item'
    
    // 메뉴
    | 'md-menu' | 'md-menu-item' | 'md-sub-menu'
    
    // 네비게이션
    | 'md-navigation-bar' | 'md-navigation-tab'
    | 'md-navigation-drawer' | 'md-navigation-rail'
    
    // 진행 표시
    | 'md-linear-progress' | 'md-circular-progress'
    
    // 기타
    | 'md-divider' | 'md-elevation' | 'md-focus-ring' | 'md-ripple'
    | 'md-tabs' | 'md-primary-tab' | 'md-secondary-tab'
    | 'md-icon' | 'md-snackbar' | 'md-card';

/**
 * Material Web Components 브리지
 */
export class MaterialBridge extends Bridge {
    private static instance: MaterialBridge | null = null;
    private materialLoaded: boolean = false;
    
    // Material 컴포넌트별 CDN 경로 매핑
    private componentPaths: Map<string, string> = new Map([
        // 버튼
        ['md-elevated-button', '@material/web/button/elevated-button.js'],
        ['md-filled-button', '@material/web/button/filled-button.js'],
        ['md-filled-tonal-button', '@material/web/button/filled-tonal-button.js'],
        ['md-outlined-button', '@material/web/button/outlined-button.js'],
        ['md-text-button', '@material/web/button/text-button.js'],
        ['md-icon-button', '@material/web/iconbutton/icon-button.js'],
        ['md-fab', '@material/web/fab/fab.js'],
        ['md-branded-fab', '@material/web/fab/branded-fab.js'],
        
        // 입력
        ['md-checkbox', '@material/web/checkbox/checkbox.js'],
        ['md-radio', '@material/web/radio/radio.js'],
        ['md-switch', '@material/web/switch/switch.js'],
        ['md-slider', '@material/web/slider/slider.js'],
        ['md-filled-text-field', '@material/web/textfield/filled-text-field.js'],
        ['md-outlined-text-field', '@material/web/textfield/outlined-text-field.js'],
        ['md-filled-select', '@material/web/select/filled-select.js'],
        ['md-outlined-select', '@material/web/select/outlined-select.js'],
        
        // 다이얼로그
        ['md-dialog', '@material/web/dialog/dialog.js'],
        
        // 리스트
        ['md-list', '@material/web/list/list.js'],
        ['md-list-item', '@material/web/list/list-item.js'],
        
        // 메뉴
        ['md-menu', '@material/web/menu/menu.js'],
        ['md-menu-item', '@material/web/menu/menu-item.js'],
        
        // 진행 표시
        ['md-linear-progress', '@material/web/progress/linear-progress.js'],
        ['md-circular-progress', '@material/web/progress/circular-progress.js'],
        
        // 기타
        ['md-divider', '@material/web/divider/divider.js'],
        ['md-elevation', '@material/web/elevation/elevation.js'],
        ['md-ripple', '@material/web/ripple/ripple.js'],
        ['md-icon', '@material/web/icon/icon.js'],
        ['md-tabs', '@material/web/tabs/tabs.js'],
        ['md-primary-tab', '@material/web/tabs/primary-tab.js'],
        ['md-secondary-tab', '@material/web/tabs/secondary-tab.js'],
    ]);
    
    constructor() {
        const transformations = new Map<string, ComponentTransform>();
        
        // 각 컴포넌트별 변환 규칙 설정
        
        // 버튼 변환 규칙
        const buttonTransform: ComponentTransform = {
            attributes: {
                remove: ['is'],
                transform: {
                    'variant': (value: string) => {
                        // AITS variant를 Material 버튼 타입으로 매핑
                        const variantMap: Record<string, string> = {
                            'primary': 'filled',
                            'secondary': 'outlined',
                            'success': 'filled-tonal',
                            'warning': 'filled-tonal',
                            'danger': 'filled',
                            'neutral': 'text'
                        };
                        return variantMap[value] || value;
                    }
                }
            },
            events: {
                wrap: true
            }
        };
        
        // 모든 버튼 타입에 동일한 변환 규칙 적용
        ['md-elevated-button', 'md-filled-button', 'md-filled-tonal-button',
         'md-outlined-button', 'md-text-button'].forEach(btnType => {
            transformations.set(btnType, buttonTransform);
        });
        
        // 텍스트 필드 변환 규칙
        const textFieldTransform: ComponentTransform = {
            attributes: {
                remove: ['is'],
                rename: {
                    'helper': 'supporting-text',
                    'error-text': 'error-text'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'change',
                    'input': 'input'
                }
            }
        };
        
        transformations.set('md-filled-text-field', textFieldTransform);
        transformations.set('md-outlined-text-field', textFieldTransform);
        
        // 체크박스 변환 규칙
        transformations.set('md-checkbox', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'change'
                }
            }
        });
        
        // 라디오 변환 규칙
        transformations.set('md-radio', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'change'
                }
            }
        });
        
        // 스위치 변환 규칙
        transformations.set('md-switch', {
            attributes: {
                remove: ['is'],
                rename: {
                    'checked': 'selected'  // Material은 selected 사용
                }
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'change'
                }
            }
        });
        
        // 다이얼로그 변환 규칙
        transformations.set('md-dialog', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'open': 'open',
                    'close': 'close',
                    'closed': 'closed'
                }
            },
            slots: {
                rename: {
                    'header': 'headline',
                    'footer': 'actions'
                }
            }
        });
        
        // 메뉴 변환 규칙
        transformations.set('md-menu', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'open': 'opened',
                    'close': 'closed'
                }
            }
        });
        
        // 슬라이더 변환 규칙
        transformations.set('md-slider', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'change',
                    'input': 'input'
                }
            }
        });
        
        // 탭 변환 규칙
        transformations.set('md-tabs', {
            attributes: {
                remove: ['is']
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'change'
                }
            }
        });
        
        // 진행 표시기 변환 규칙
        transformations.set('md-linear-progress', {
            attributes: {
                remove: ['is'],
                transform: {
                    'value': (value: string) => {
                        // 0-100을 0-1로 변환
                        const numValue = parseFloat(value);
                        return String(numValue / 100);
                    }
                }
            }
        });
        
        transformations.set('md-circular-progress', {
            attributes: {
                remove: ['is'],
                transform: {
                    'value': (value: string) => {
                        // 0-100을 0-1로 변환
                        const numValue = parseFloat(value);
                        return String(numValue / 100);
                    }
                }
            }
        });
        
        // 설정 생성
        const config: BridgeConfig = {
            prefix: 'md',
            library: 'Material Web Components',
            version: '1.2.0',
            cdnUrl: 'https://unpkg.com/@material/web@1.2.0',
            loadStrategy: 'lazy',
            transformations
        };
        
        super(config);
    }
    
    /**
     * 싱글톤 인스턴스 가져오기
     */
    static getInstance(): MaterialBridge {
        if (!this.instance) {
            this.instance = new MaterialBridge();
        }
        return this.instance;
    }
    
    /**
     * Material 라이브러리 로드
     */
    protected async performLoad(): Promise<void> {
        if (this.materialLoaded) return;
        
        console.log('[MaterialBridge] Loading Material Web Components...');
        
        // 이미 로드되었는지 확인
        if ((window as any).materialWebComponents) {
            this.materialLoaded = true;
            return;
        }
        
        // Material 테마 설정
        this.setupTheme();
        
        // 기본 스타일 로드
        await this.loadStyles();
        
        this.materialLoaded = true;
        console.log('[MaterialBridge] Material Web Components loaded successfully');
    }
    
    /**
     * 컴포넌트별 스크립트 동적 로드
     */
    private async loadComponentScript(componentName: string): Promise<void> {
        const path = this.componentPaths.get(componentName);
        if (!path) {
            console.warn(`[MaterialBridge] Unknown component: ${componentName}`);
            return;
        }
        
        // 이미 로드되었는지 확인
        if (customElements.get(componentName)) {
            return;
        }
        
        const script = document.createElement('script');
        script.type = 'module';
        script.src = `${this.config.cdnUrl}/${path}`;
        
        return new Promise((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${componentName}`));
            document.head.appendChild(script);
        });
    }
    
    /**
     * Material 기본 스타일 로드
     */
    private async loadStyles(): Promise<void> {
        const style = document.createElement('style');
        style.textContent = `
            /* Material Web Components Base Styles */
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
            @import url('https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined');
            
            :root {
                /* Material 3 색상 토큰 */
                --md-sys-color-primary: var(--aits-color-primary, #6750a4);
                --md-sys-color-on-primary: var(--aits-color-on-primary, #ffffff);
                --md-sys-color-primary-container: var(--aits-color-primary-container, #eaddff);
                --md-sys-color-on-primary-container: var(--aits-color-on-primary-container, #21005d);
                
                --md-sys-color-secondary: var(--aits-color-secondary, #625b71);
                --md-sys-color-on-secondary: var(--aits-color-on-secondary, #ffffff);
                --md-sys-color-secondary-container: var(--aits-color-secondary-container, #e8def8);
                --md-sys-color-on-secondary-container: var(--aits-color-on-secondary-container, #1d192b);
                
                --md-sys-color-tertiary: var(--aits-color-tertiary, #7d5260);
                --md-sys-color-on-tertiary: var(--aits-color-on-tertiary, #ffffff);
                --md-sys-color-tertiary-container: var(--aits-color-tertiary-container, #ffd8e4);
                --md-sys-color-on-tertiary-container: var(--aits-color-on-tertiary-container, #31111d);
                
                --md-sys-color-error: var(--aits-color-error, #ba1a1a);
                --md-sys-color-on-error: var(--aits-color-on-error, #ffffff);
                --md-sys-color-error-container: var(--aits-color-error-container, #ffdad6);
                --md-sys-color-on-error-container: var(--aits-color-on-error-container, #410002);
                
                --md-sys-color-surface: var(--aits-color-surface, #fffbfe);
                --md-sys-color-on-surface: var(--aits-color-on-surface, #1c1b1f);
                --md-sys-color-surface-variant: var(--aits-color-surface-variant, #e7e0ec);
                --md-sys-color-on-surface-variant: var(--aits-color-on-surface-variant, #49454f);
                
                --md-sys-color-outline: var(--aits-color-outline, #79747e);
                --md-sys-color-outline-variant: var(--aits-color-outline-variant, #cac4d0);
                
                /* Material 3 형태 토큰 */
                --md-sys-shape-corner-none: 0;
                --md-sys-shape-corner-extra-small: var(--aits-radius-xs, 4px);
                --md-sys-shape-corner-small: var(--aits-radius-sm, 8px);
                --md-sys-shape-corner-medium: var(--aits-radius-md, 12px);
                --md-sys-shape-corner-large: var(--aits-radius-lg, 16px);
                --md-sys-shape-corner-extra-large: var(--aits-radius-xl, 28px);
                --md-sys-shape-corner-full: var(--aits-radius-full, 9999px);
                
                /* 타이포그래피 */
                --md-sys-typescale-body-medium-font: 'Roboto', sans-serif;
                --md-sys-typescale-body-medium-size: 14px;
                --md-sys-typescale-body-medium-weight: 400;
                
                /* 모션 */
                --md-sys-motion-duration-short1: 50ms;
                --md-sys-motion-duration-short2: 100ms;
                --md-sys-motion-duration-short3: 150ms;
                --md-sys-motion-duration-short4: 200ms;
                --md-sys-motion-duration-medium1: 250ms;
                --md-sys-motion-duration-medium2: 300ms;
                --md-sys-motion-duration-medium3: 350ms;
                --md-sys-motion-duration-medium4: 400ms;
                --md-sys-motion-duration-long1: 450ms;
                --md-sys-motion-duration-long2: 500ms;
                --md-sys-motion-duration-long3: 550ms;
                --md-sys-motion-duration-long4: 600ms;
                
                --md-sys-motion-easing-linear: cubic-bezier(0, 0, 1, 1);
                --md-sys-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);
                --md-sys-motion-easing-standard-accelerate: cubic-bezier(0.3, 0, 1, 1);
                --md-sys-motion-easing-standard-decelerate: cubic-bezier(0, 0, 0, 1);
                --md-sys-motion-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);
                --md-sys-motion-easing-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
                --md-sys-motion-easing-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
            }
            
            /* 다크 모드 지원 */
            @media (prefers-color-scheme: dark) {
                :root {
                    --md-sys-color-primary: var(--aits-color-primary-dark, #d0bcff);
                    --md-sys-color-on-primary: var(--aits-color-on-primary-dark, #381e72);
                    --md-sys-color-primary-container: var(--aits-color-primary-container-dark, #4f378b);
                    --md-sys-color-on-primary-container: var(--aits-color-on-primary-container-dark, #eaddff);
                    
                    --md-sys-color-surface: var(--aits-color-surface-dark, #1c1b1f);
                    --md-sys-color-on-surface: var(--aits-color-on-surface-dark, #e6e1e5);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 테마 설정
     */
    private setupTheme(): void {
        // Material You 동적 색상 지원
        if ('MaterialColorUtilities' in window) {
            this.setupDynamicColors();
        }
    }
    
    /**
     * Material You 동적 색상 설정
     */
    private async setupDynamicColors(): Promise<void> {
        // 사용자 지정 색상 또는 이미지에서 색상 추출
        // 실제 구현은 Material Color Utilities 라이브러리 필요
        console.log('[MaterialBridge] Dynamic colors ready');
    }
    
    /**
     * 웹 컴포넌트 생성 (오버라이드)
     */
    protected createElement(componentName: string): HTMLElement | null {
        // 동기적으로 요소 생성
        const element = super.createElement(componentName);
        
        if (!element) return null;
        
        // 컴포넌트 스크립트는 transform 메서드에서 로드
        this.initializeComponent(componentName, element);
        
        return element;
    }
    
    /**
     * 컴포넌트 초기화
     */
    private initializeComponent(componentName: string, element: HTMLElement): void {
        // 컴포넌트별 초기화
        switch (componentName) {
            case 'md-dialog':
                // 다이얼로그는 body에 추가
                document.body.appendChild(element);
                break;
                
            case 'md-menu':
                // 메뉴 위치 설정
                (element as any).positioning = 'absolute';
                break;
                
            case 'md-snackbar':
                // 스낵바는 body에 추가
                document.body.appendChild(element);
                break;
        }
    }
    
    /**
     * 요소를 웹 컴포넌트로 변환 (오버라이드)
     */
    async transform(element: HTMLElement): Promise<HTMLElement | null> {
        const isValue = element.getAttribute('is');
        if (!isValue || !isValue.startsWith(this.config.prefix + '-')) {
            return null;
        }
        
        // 컴포넌트 스크립트 로드
        await this.loadComponentScript(isValue);
        
        // 부모 클래스의 transform 호출
        return super.transform(element);
    }
    
    /**
     * Material 컴포넌트 헬퍼 메서드
     */
    
    /**
     * 스낵바 표시
     */
    static async showSnackbar(
        message: string,
        action?: string,
        duration: number = 5000
    ): Promise<MdSnackbar> {
        const bridge = MaterialBridge.getInstance();
        await bridge.load();
        await bridge.loadComponentScript('md-snackbar');
        
        const snackbar = document.createElement('md-snackbar') as MdSnackbar;
        snackbar.message = message;
        if (action) {
            snackbar.action = action;
        }
        snackbar.timeoutMs = duration;
        
        document.body.appendChild(snackbar);
        snackbar.show();
        
        return snackbar;
    }
    
    /**
     * 다이얼로그 생성
     */
    static async createDialog(options: {
        headline: string;
        content: string;
        actions?: Array<{ text: string; value: string }>;
    }): Promise<MdDialog> {
        const bridge = MaterialBridge.getInstance();
        await bridge.load();
        await bridge.loadComponentScript('md-dialog');
        
        const dialog = document.createElement('md-dialog') as MdDialog;
        
        dialog.innerHTML = `
            <div slot="headline">${options.headline}</div>
            <div slot="content">${options.content}</div>
            ${options.actions ? `
                <div slot="actions">
                    ${options.actions.map(action => `
                        <md-text-button value="${action.value}">${action.text}</md-text-button>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        document.body.appendChild(dialog);
        return dialog;
    }
    
    /**
     * 컴포넌트 초기화
     */
    static async init(): Promise<void> {
        const bridge = MaterialBridge.getInstance();
        await bridge.load();
        bridge.startAutoTransform();
    }
}

// 자동 초기화 (옵션)
if (typeof window !== 'undefined' && (window as any).autoInitMaterial !== false) {
    // DOM 준비 후 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            MaterialBridge.init();
        });
    } else {
        MaterialBridge.init();
    }
}

// 전역에서 사용할 수 있도록 export
export default MaterialBridge;