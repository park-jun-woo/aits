import { registerBridge, BridgeUtils } from '@aits/core';
import { ionicPreset } from './preset';
import {
    presentToast,
    presentLoading,
    presentAlert,
    presentActionSheet,
    confirm,
    prompt,
    createModal,
    createPopover,
    setMode,
    setTheme,
    waitForComponent,
    waitForAllComponents,
    initializeIonic
} from './helpers';

// 타입 export
export * from './types';

// 프리셋 export
export { ionicPreset };
export default ionicPreset;

// 헬퍼 함수들 export
export {
    presentToast,
    presentLoading,
    presentAlert,
    presentActionSheet,
    confirm,
    prompt,
    createModal,
    createPopover,
    setMode,
    setTheme,
    waitForComponent,
    waitForAllComponents,
    initializeIonic
};

// 설정 옵션
export interface IonicConfig {
    mode?: 'ios' | 'md';
    animated?: boolean;
    rippleEffect?: boolean;
    hardwareBackButton?: boolean;
    statusTap?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    autoRegister?: boolean;
    autoTransform?: boolean;
}

/**
 * Ionic Bridge 초기화
 */
export async function initIonic(config: IonicConfig = {}): Promise<void> {
    // Ionic 초기화
    await initializeIonic();
    
    // 플랫폼 모드 설정
    if (config.mode) {
        setMode(config.mode);
    }
    
    // 테마 설정
    if (config.theme) {
        setTheme(config.theme);
    }
    
    // Ionic config 설정
    const ionicConfig = (window as any).Ionic?.config;
    if (ionicConfig) {
        if (config.animated !== undefined) {
            ionicConfig.set('animated', config.animated);
        }
        if (config.rippleEffect !== undefined) {
            ionicConfig.set('rippleEffect', config.rippleEffect);
        }
        if (config.hardwareBackButton !== undefined) {
            ionicConfig.set('hardwareBackButton', config.hardwareBackButton);
        }
        if (config.statusTap !== undefined) {
            ionicConfig.set('statusTap', config.statusTap);
        }
    }
    
    // 브리지 등록
    if (config.autoRegister !== false) {
        registerBridge(ionicPreset);
    }
    
    // 자동 변환 시작
    if (config.autoTransform) {
        BridgeUtils.startAutoTransform();
    }
    
    console.log('[Ionic] Bridge initialized');
}

// DOM 준비 시 자동 초기화
if (typeof window !== 'undefined') {
    // 전역 네임스페이스 등록
    (window as any).IonicBridge = {
        init: initIonic,
        preset: ionicPreset,
        presentToast,
        presentLoading,
        presentAlert,
        presentActionSheet,
        confirm,
        prompt,
        createModal,
        createPopover,
        setMode,
        setTheme,
        waitForComponent,
        waitForAllComponents,
        initializeIonic
    };
    
    // data-auto-init 속성이 있으면 자동 초기화
    document.addEventListener('DOMContentLoaded', () => {
        const script = document.querySelector('script[data-ionic-auto-init]');
        if (script) {
            const config: IonicConfig = {
                autoRegister: true,
                autoTransform: true,
                mode: script.getAttribute('data-mode') as 'ios' | 'md' || undefined,
                theme: script.getAttribute('data-theme') as 'light' | 'dark' | 'auto' || 'auto',
                animated: script.getAttribute('data-animated') !== 'false',
                rippleEffect: script.getAttribute('data-ripple') !== 'false'
            };
            initIonic(config);
        }
    });
}

/**
 * Ionic Controller 생성 헬퍼
 */
export async function createIonicController(type: 'modal' | 'popover' | 'alert' | 'loading' | 'toast', options: any): Promise<any> {
    switch (type) {
        case 'modal':
            return createModal(options);
        case 'popover':
            return createPopover(options);
        case 'alert':
            return presentAlert(options);
        case 'loading':
            return presentLoading(options);
        case 'toast':
            return presentToast(options);
        default:
            throw new Error(`Unknown controller type: ${type}`);
    }
}

/**
 * Ionic 컴포넌트 준비 상태 체크
 */
export async function isIonicReady(): Promise<boolean> {
    // Check if Ionic is loaded
    if (!(window as any).__IONIC_INITIALIZED__) {
        return false;
    }
    
    // Check if core components are defined
    const coreComponents = ['ion-app', 'ion-content', 'ion-button', 'ion-modal'];
    for (const component of coreComponents) {
        if (!customElements.get(component)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Ionic 앱 래퍼 생성
 */
export function createIonicApp(content: string | HTMLElement): HTMLElement {
    const app = document.createElement('ion-app');
    const ionContent = document.createElement('ion-content');
    
    if (typeof content === 'string') {
        ionContent.innerHTML = content;
    } else {
        ionContent.appendChild(content);
    }
    
    app.appendChild(ionContent);
    return app;
}

/**
 * Ionic 네비게이션 설정
 */
export function setupIonicNavigation(options: {
    defaultHref?: string;
    animated?: boolean;
    swipeGesture?: boolean;
}): void {
    const ionRouterOutlet = document.querySelector('ion-router-outlet');
    if (ionRouterOutlet) {
        if (options.animated !== undefined) {
            ionRouterOutlet.setAttribute('animated', String(options.animated));
        }
        if (options.swipeGesture !== undefined) {
            (ionRouterOutlet as any).swipeGesture = options.swipeGesture;
        }
    }
    
    const ionBackButtons = document.querySelectorAll('ion-back-button');
    ionBackButtons.forEach(button => {
        if (options.defaultHref) {
            button.setAttribute('default-href', options.defaultHref);
        }
    });
}