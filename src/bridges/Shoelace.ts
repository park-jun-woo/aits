/**
 * =================================================================
 * Shoelace.ts - Shoelace 웹 컴포넌트 브리지
 * =================================================================
 * @description
 * - Shoelace 웹 컴포넌트를 AITS에서 사용할 수 있도록 브리지
 * - is="sl-*" 패턴을 <sl-*>로 자동 변환
 * - 속성, 이벤트, 슬롯 매핑 지원
 * @author Aits Framework AI
 * @version 1.0.0
 * @see https://shoelace.style/
 */

import { Bridge, BridgeConfig, ComponentTransform, ComponentTransformMap } from '../Bridge';

// Shoelace 컴포넌트 인터페이스 정의
interface SlAlert extends HTMLElement {
    variant: 'primary' | 'success' | 'neutral' | 'warning' | 'danger';
    closable: boolean;
    duration: number;
    toast(): void;
}

interface SlDialog extends HTMLElement {
    label: string;
    open: boolean;
    show(): void;
    hide(): void;
}

// Shoelace 컴포넌트 타입 정의
export type ShoelaceComponent = 
    // 버튼 & 입력
    | 'sl-button' | 'sl-button-group' | 'sl-icon-button'
    | 'sl-input' | 'sl-textarea' | 'sl-select' | 'sl-checkbox' 
    | 'sl-radio' | 'sl-radio-group' | 'sl-radio-button'
    | 'sl-range' | 'sl-rating' | 'sl-switch' | 'sl-color-picker'
    
    // 데이터 표시
    | 'sl-alert' | 'sl-badge' | 'sl-card' | 'sl-details'
    | 'sl-dialog' | 'sl-drawer' | 'sl-dropdown' | 'sl-menu'
    | 'sl-menu-item' | 'sl-menu-label' | 'sl-divider'
    | 'sl-tooltip' | 'sl-tag' | 'sl-tree' | 'sl-tree-item'
    
    // 피드백
    | 'sl-spinner' | 'sl-progress-bar' | 'sl-progress-ring'
    | 'sl-skeleton' | 'sl-animation'
    
    // 레이아웃
    | 'sl-breadcrumb' | 'sl-breadcrumb-item' | 'sl-tab-group'
    | 'sl-tab' | 'sl-tab-panel' | 'sl-split-panel'
    
    // 유틸리티
    | 'sl-avatar' | 'sl-icon' | 'sl-image-comparer'
    | 'sl-include' | 'sl-mutation-observer' | 'sl-resize-observer'
    | 'sl-format-bytes' | 'sl-format-date' | 'sl-format-number'
    | 'sl-relative-time' | 'sl-qr-code' | 'sl-visually-hidden';

/**
 * Shoelace 브리지 설정
 */
export class ShoelaceBridge extends Bridge {
    private static instance: ShoelaceBridge | null = null;
    private shoelaceLoaded: boolean = false;
    
    constructor() {
        const transformations = new Map<string, ComponentTransform>();
        
        // 각 컴포넌트별 변환 규칙 설정
        transformations.set('sl-button', {
            attributes: {
                remove: ['is'],
                transform: {
                    // AITS 스타일을 Shoelace variant로 매핑
                    'variant': (value: string) => {
                        const variantMap: Record<string, string> = {
                            'primary': 'primary',
                            'secondary': 'default',
                            'success': 'success',
                            'warning': 'warning',
                            'danger': 'danger',
                            'neutral': 'neutral'
                        };
                        return variantMap[value] || value;
                    }
                }
            },
            events: {
                wrap: true,
                rename: {
                    'click': 'sl-click'
                }
            }
        });
        
        transformations.set('sl-input', {
            attributes: {
                remove: ['is'],
                rename: {
                    'readonly': 'readonly',
                    'required': 'required'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'sl-change',
                    'input': 'sl-input',
                    'blur': 'sl-blur',
                    'focus': 'sl-focus'
                }
            }
        });
        
        transformations.set('sl-dialog', {
            attributes: {
                remove: ['is'],
                rename: {
                    'open': 'open'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'open': 'sl-show',
                    'close': 'sl-hide',
                    'closed': 'sl-after-hide'
                }
            },
            slots: {
                rename: {
                    'header': 'label',
                    'footer': 'footer'
                }
            }
        });
        
        transformations.set('sl-alert', {
            attributes: {
                remove: ['is'],
                transform: {
                    'variant': (value: string) => {
                        // AITS variant를 Shoelace variant로 매핑
                        return value;
                    }
                }
            },
            events: {
                wrap: true,
                rename: {
                    'close': 'sl-hide'
                }
            }
        });
        
        transformations.set('sl-card', {
            attributes: {
                remove: ['is']
            },
            slots: {
                rename: {
                    'image': 'image',
                    'header': 'header',
                    'footer': 'footer'
                }
            }
        });
        
        transformations.set('sl-dropdown', {
            attributes: {
                remove: ['is'],
                rename: {
                    'open': 'open',
                    'placement': 'placement',
                    'distance': 'distance'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'open': 'sl-show',
                    'close': 'sl-hide'
                }
            },
            slots: {
                rename: {
                    'trigger': 'trigger'
                }
            }
        });
        
        transformations.set('sl-tab-group', {
            attributes: {
                remove: ['is'],
                rename: {
                    'placement': 'placement'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'sl-tab-show'
                }
            }
        });
        
        transformations.set('sl-select', {
            attributes: {
                remove: ['is'],
                rename: {
                    'multiple': 'multiple',
                    'clearable': 'clearable'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'sl-change'
                }
            }
        });
        
        transformations.set('sl-checkbox', {
            attributes: {
                remove: ['is'],
                rename: {
                    'checked': 'checked',
                    'indeterminate': 'indeterminate'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'sl-change'
                }
            }
        });
        
        transformations.set('sl-switch', {
            attributes: {
                remove: ['is'],
                rename: {
                    'checked': 'checked'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'sl-change'
                }
            }
        });
        
        transformations.set('sl-progress-bar', {
            attributes: {
                remove: ['is'],
                rename: {
                    'value': 'value',
                    'indeterminate': 'indeterminate'
                }
            }
        });
        
        transformations.set('sl-rating', {
            attributes: {
                remove: ['is'],
                rename: {
                    'value': 'value',
                    'max': 'max',
                    'readonly': 'readonly'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'change': 'sl-change'
                }
            }
        });
        
        transformations.set('sl-tooltip', {
            attributes: {
                remove: ['is'],
                rename: {
                    'content': 'content',
                    'placement': 'placement',
                    'trigger': 'trigger'
                }
            }
        });
        
        transformations.set('sl-drawer', {
            attributes: {
                remove: ['is'],
                rename: {
                    'open': 'open',
                    'placement': 'placement'
                }
            },
            events: {
                wrap: true,
                rename: {
                    'open': 'sl-show',
                    'close': 'sl-hide'
                }
            },
            slots: {
                rename: {
                    'header': 'label',
                    'footer': 'footer'
                }
            }
        });
        
        // 설정 생성
        const config: BridgeConfig = {
            prefix: 'sl',
            library: 'Shoelace',
            version: '2.12.0',
            cdnUrl: 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0',
            loadStrategy: 'lazy',
            transformations
        };
        
        super(config);
    }
    
    /**
     * 싱글톤 인스턴스 가져오기
     */
    static getInstance(): ShoelaceBridge {
        if (!this.instance) {
            this.instance = new ShoelaceBridge();
        }
        return this.instance;
    }
    
    /**
     * Shoelace 라이브러리 로드
     */
    protected async performLoad(): Promise<void> {
        if (this.shoelaceLoaded) return;
        
        console.log('[ShoelaceBridge] Loading Shoelace...');
        
        // 이미 로드되었는지 확인
        if ((window as any).shoelace) {
            this.shoelaceLoaded = true;
            return;
        }
        
        // 스타일시트 로드
        await this.loadStylesheet();
        
        // 스크립트 로드
        await this.loadScript();
        
        // 테마 설정
        this.setupTheme();
        
        this.shoelaceLoaded = true;
        console.log('[ShoelaceBridge] Shoelace loaded successfully');
    }
    
    /**
     * Shoelace 스타일시트 로드
     */
    private async loadStylesheet(): Promise<void> {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${this.config.cdnUrl}/cdn/themes/light.css`;
        
        return new Promise((resolve, reject) => {
            link.onload = () => resolve();
            link.onerror = () => reject(new Error('Failed to load Shoelace stylesheet'));
            document.head.appendChild(link);
        });
    }
    
    /**
     * Shoelace 스크립트 로드
     */
    private async loadScript(): Promise<void> {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = `${this.config.cdnUrl}/cdn/shoelace-autoloader.js`;
        
        return new Promise((resolve, reject) => {
            script.onload = () => {
                // 아이콘 경로 설정
                this.setBasePath();
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Shoelace script'));
            document.head.appendChild(script);
        });
    }
    
    /**
     * Shoelace 기본 경로 설정
     */
    private setBasePath(): void {
        const setBasePath = (window as any).setBasePath;
        if (setBasePath) {
            setBasePath(`${this.config.cdnUrl}/cdn/`);
        }
    }
    
    /**
     * 테마 설정
     */
    private setupTheme(): void {
        // CSS 변수를 통한 테마 커스터마이징
        const style = document.createElement('style');
        style.textContent = `
            :root {
                /* Shoelace 테마 변수를 AITS 변수와 연결 */
                --sl-color-primary-50: var(--aits-color-primary-50, #eff6ff);
                --sl-color-primary-100: var(--aits-color-primary-100, #dbeafe);
                --sl-color-primary-200: var(--aits-color-primary-200, #bfdbfe);
                --sl-color-primary-300: var(--aits-color-primary-300, #93c5fd);
                --sl-color-primary-400: var(--aits-color-primary-400, #60a5fa);
                --sl-color-primary-500: var(--aits-color-primary-500, #3b82f6);
                --sl-color-primary-600: var(--aits-color-primary, #2563eb);
                --sl-color-primary-700: var(--aits-color-primary-dark, #1d4ed8);
                
                --sl-border-radius-small: var(--aits-radius-sm, 0.25rem);
                --sl-border-radius-medium: var(--aits-radius-md, 0.375rem);
                --sl-border-radius-large: var(--aits-radius-lg, 0.5rem);
                
                --sl-spacing-small: var(--aits-spacing-sm, 0.5rem);
                --sl-spacing-medium: var(--aits-spacing-md, 1rem);
                --sl-spacing-large: var(--aits-spacing-lg, 1.5rem);
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
            case 'sl-dialog':
            case 'sl-drawer':
                // 모달 컴포넌트는 body에 추가
                document.body.appendChild(element);
                break;
                
            case 'sl-tooltip':
                // 툴팁은 자동으로 활성화
                (element as any).hoist = true;
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
        
        // Shoelace 특수 속성 처리
        const componentName = target.tagName.toLowerCase();
        
        switch (componentName) {
            case 'sl-button':
                // href가 있으면 링크 버튼으로
                if (source.hasAttribute('href')) {
                    target.setAttribute('href', source.getAttribute('href')!);
                }
                break;
                
            case 'sl-input':
            case 'sl-textarea':
                // 폼 속성 처리
                ['name', 'value', 'placeholder'].forEach(attr => {
                    if (source.hasAttribute(attr)) {
                        target.setAttribute(attr, source.getAttribute(attr)!);
                    }
                });
                break;
        }
    }
    
    /**
     * Shoelace 컴포넌트 헬퍼 메서드
     */
    
    /**
     * 토스트 알림 표시
     */
    static async toast(
        message: string, 
        variant: 'primary' | 'success' | 'neutral' | 'warning' | 'danger' = 'primary',
        duration: number = 3000
    ): Promise<void> {
        const bridge = ShoelaceBridge.getInstance();
        await bridge.load();
        
        const alert = document.createElement('sl-alert') as SlAlert;
        alert.variant = variant;
        alert.closable = true;
        alert.duration = duration;
        alert.innerHTML = `
            <sl-icon slot="icon" name="info-circle"></sl-icon>
            ${message}
        `;
        
        document.body.appendChild(alert);
        alert.toast();
    }
    
    /**
     * 다이얼로그 생성
     */
    static async createDialog(options: {
        label: string;
        content: string;
        footer?: string;
    }): Promise<SlDialog> {
        const bridge = ShoelaceBridge.getInstance();
        await bridge.load();
        
        const dialog = document.createElement('sl-dialog') as SlDialog;
        dialog.label = options.label;
        dialog.innerHTML = `
            ${options.content}
            ${options.footer ? `<div slot="footer">${options.footer}</div>` : ''}
        `;
        
        document.body.appendChild(dialog);
        return dialog;
    }
    
    /**
     * 컴포넌트 초기화
     */
    static async init(): Promise<void> {
        const bridge = ShoelaceBridge.getInstance();
        await bridge.load();
        bridge.startAutoTransform();
    }
}

// 자동 초기화 (옵션)
if (typeof window !== 'undefined' && (window as any).autoInitShoelace !== false) {
    // DOM 준비 후 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ShoelaceBridge.init();
        });
    } else {
        ShoelaceBridge.init();
    }
}

// 전역에서 사용할 수 있도록 export
export default ShoelaceBridge;