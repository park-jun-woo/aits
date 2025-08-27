import type {
    IonModal,
    IonPopover,
    IonLoading,
    IonToast,
    IonAlert,
    OverlayEventDetail
} from './types';

/**
 * Ionic 컴포넌트가 로드될 때까지 대기
 */
async function ensureIonicLoaded(): Promise<void> {
    if (!customElements.get('ion-modal')) {
        await new Promise<void>((resolve) => {
            const check = () => {
                if (customElements.get('ion-modal')) {
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
    }
}

/**
 * 토스트 메시지 표시
 */
export async function presentToast(options: {
    message: string;
    duration?: number;
    position?: 'top' | 'bottom' | 'middle';
    color?: string;
    icon?: string;
    buttons?: Array<{
        text: string;
        role?: 'cancel' | string;
        handler?: () => void;
    }>;
    cssClass?: string | string[];
}): Promise<void> {
    await ensureIonicLoaded();
    
    const toast = document.createElement('ion-toast') as IonToast;
    toast.message = options.message;
    toast.duration = options.duration || 2000;
    toast.position = options.position || 'bottom';
    
    if (options.color) toast.color = options.color;
    if (options.icon) toast.icon = options.icon;
    if (options.buttons) toast.buttons = options.buttons as any;
    if (options.cssClass) toast.cssClass = options.cssClass;
    
    document.body.appendChild(toast);
    await customElements.whenDefined('ion-toast');
    await toast.present();
    
    await toast.onDidDismiss();
    toast.remove();
}

/**
 * 로딩 인디케이터 표시
 */
export async function presentLoading(options: {
    message?: string;
    spinner?: 'bubbles' | 'circles' | 'circular' | 'crescent' | 'dots' | 'lines' | 'lines-sharp' | 'lines-sharp-small' | 'lines-small' | null;
    duration?: number;
    cssClass?: string | string[];
    backdropDismiss?: boolean;
}): Promise<IonLoading> {
    await ensureIonicLoaded();
    
    const loading = document.createElement('ion-loading') as IonLoading;
    
    if (options.message) loading.message = options.message;
    if (options.spinner !== undefined) loading.spinner = options.spinner;
    if (options.duration) loading.duration = options.duration;
    if (options.cssClass) loading.cssClass = options.cssClass;
    if (options.backdropDismiss !== undefined) loading.backdropDismiss = options.backdropDismiss;
    
    document.body.appendChild(loading);
    await customElements.whenDefined('ion-loading');
    await loading.present();
    
    return loading;
}

/**
 * 알림 다이얼로그 표시
 */
export async function presentAlert(options: {
    header?: string;
    subHeader?: string;
    message?: string;
    buttons?: Array<{
        text: string;
        role?: 'cancel' | 'destructive' | string;
        cssClass?: string | string[];
        handler?: (data?: any) => void;
    }>;
    inputs?: Array<{
        type?: 'checkbox' | 'date' | 'email' | 'number' | 'password' | 'radio' | 'tel' | 'text' | 'textarea' | 'time' | 'url';
        name?: string;
        placeholder?: string;
        value?: any;
        label?: string;
        checked?: boolean;
        disabled?: boolean;
        min?: string | number;
        max?: string | number;
    }>;
    cssClass?: string | string[];
    backdropDismiss?: boolean;
}): Promise<OverlayEventDetail> {
    await ensureIonicLoaded();
    
    const alert = document.createElement('ion-alert') as IonAlert;
    
    if (options.header) alert.header = options.header;
    if (options.subHeader) alert.subHeader = options.subHeader;
    if (options.message) alert.message = options.message;
    if (options.buttons) alert.buttons = options.buttons as any;
    if (options.inputs) alert.inputs = options.inputs as any;
    if (options.cssClass) alert.cssClass = options.cssClass;
    if (options.backdropDismiss !== undefined) alert.backdropDismiss = options.backdropDismiss;
    
    document.body.appendChild(alert);
    await customElements.whenDefined('ion-alert');
    await alert.present();
    
    const result = await alert.onDidDismiss();
    alert.remove();
    
    return result;
}

/**
 * 확인 다이얼로그
 */
export async function confirm(
    message: string,
    header?: string,
    okText: string = 'OK',
    cancelText: string = 'Cancel'
): Promise<boolean> {
    const result = await presentAlert({
        header,
        message,
        buttons: [
            {
                text: cancelText,
                role: 'cancel'
            },
            {
                text: okText,
                role: 'confirm'
            }
        ]
    });
    
    return result.role === 'confirm';
}

/**
 * 입력 프롬프트
 */
export async function prompt(
    message: string,
    header?: string,
    placeholder?: string,
    defaultValue?: string
): Promise<string | null> {
    const result = await presentAlert({
        header,
        message,
        inputs: [
            {
                type: 'text',
                name: 'value',
                placeholder,
                value: defaultValue
            }
        ],
        buttons: [
            {
                text: 'Cancel',
                role: 'cancel'
            },
            {
                text: 'OK',
                role: 'confirm'
            }
        ]
    });
    
    if (result.role === 'confirm' && result.data?.values) {
        return result.data.values.value;
    }
    
    return null;
}

/**
 * 모달 생성 및 표시
 */
export async function createModal(options: {
    component: string | HTMLElement;
    componentProps?: Record<string, any>;
    presentingElement?: HTMLElement;
    showBackdrop?: boolean;
    backdropDismiss?: boolean;
    cssClass?: string | string[];
    animated?: boolean;
    swipeToClose?: boolean;
    breakpoints?: number[];
    initialBreakpoint?: number;
}): Promise<IonModal> {
    await ensureIonicLoaded();
    
    const modal = document.createElement('ion-modal') as IonModal;
    
    // Component 설정
    if (typeof options.component === 'string') {
        modal.innerHTML = options.component;
    } else {
        modal.appendChild(options.component);
    }
    
    // Props 설정
    if (options.presentingElement) modal.presentingElement = options.presentingElement;
    if (options.showBackdrop !== undefined) modal.showBackdrop = options.showBackdrop;
    if (options.backdropDismiss !== undefined) modal.backdropDismiss = options.backdropDismiss;
    if (options.cssClass) modal.cssClass = options.cssClass;
    if (options.animated !== undefined) modal.animated = options.animated;
    if (options.breakpoints) modal.breakpoints = options.breakpoints;
    if (options.initialBreakpoint) modal.initialBreakpoint = options.initialBreakpoint;
    
    document.body.appendChild(modal);
    await customElements.whenDefined('ion-modal');
    
    return modal;
}

/**
 * 팝오버 생성 및 표시
 */
export async function createPopover(options: {
    component: string | HTMLElement;
    componentProps?: Record<string, any>;
    event?: Event;
    showBackdrop?: boolean;
    backdropDismiss?: boolean;
    translucent?: boolean;
    cssClass?: string | string[];
    animated?: boolean;
    keyboardClose?: boolean;
    trigger?: string;
    triggerAction?: 'click' | 'hover' | 'context-menu';
    reference?: 'event' | 'trigger';
    side?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';
    alignment?: 'center' | 'end' | 'start';
    arrow?: boolean;
    size?: 'auto' | 'cover';
}): Promise<IonPopover> {
    await ensureIonicLoaded();
    
    const popover = document.createElement('ion-popover') as IonPopover;
    
    // Component 설정
    if (typeof options.component === 'string') {
        popover.innerHTML = options.component;
    } else {
        popover.appendChild(options.component);
    }
    
    // Props 설정
    if (options.event) popover.event = options.event;
    if (options.showBackdrop !== undefined) popover.showBackdrop = options.showBackdrop;
    if (options.backdropDismiss !== undefined) popover.backdropDismiss = options.backdropDismiss;
    if (options.translucent !== undefined) popover.translucent = options.translucent;
    if (options.cssClass) popover.cssClass = options.cssClass;
    if (options.animated !== undefined) popover.animated = options.animated;
    if (options.keyboardClose !== undefined) popover.keyboardClose = options.keyboardClose;
    if (options.trigger) popover.trigger = options.trigger;
    if (options.triggerAction) popover.triggerAction = options.triggerAction;
    if (options.reference) popover.reference = options.reference;
    if (options.side) popover.side = options.side;
    if (options.alignment) popover.alignment = options.alignment;
    if (options.arrow !== undefined) popover.arrow = options.arrow;
    if (options.size) popover.size = options.size;
    
    document.body.appendChild(popover);
    await customElements.whenDefined('ion-popover');
    
    return popover;
}

/**
 * Action Sheet 표시
 */
export async function presentActionSheet(options: {
    header?: string;
    subHeader?: string;
    cssClass?: string | string[];
    buttons: Array<{
        text: string;
        role?: 'destructive' | 'cancel' | string;
        icon?: string;
        cssClass?: string | string[];
        handler?: () => void | boolean;
    }>;
    backdropDismiss?: boolean;
    translucent?: boolean;
    animated?: boolean;
    mode?: 'ios' | 'md';
    keyboardClose?: boolean;
}): Promise<string | undefined> {
    await ensureIonicLoaded();
    
    const actionSheet = document.createElement('ion-action-sheet');
    
    Object.assign(actionSheet, options);
    
    document.body.appendChild(actionSheet);
    await customElements.whenDefined('ion-action-sheet');
    await (actionSheet as any).present();
    
    const result = await (actionSheet as any).onDidDismiss();
    actionSheet.remove();
    
    return result.role;
}

/**
 * 플랫폼별 모드 설정
 */
export function setMode(mode: 'ios' | 'md'): void {
    const ionicConfig = (window as any).Ionic?.config;
    if (ionicConfig) {
        ionicConfig.set('mode', mode);
    }
    
    document.documentElement.setAttribute('mode', mode);
}

/**
 * 테마 설정
 */
export function setTheme(theme: 'light' | 'dark' | 'auto'): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    function applyTheme(isDark: boolean) {
        document.body.classList.toggle('dark', isDark);
        
        // Ionic CSS 변수 조정
        if (isDark) {
            document.documentElement.style.setProperty('--ion-background-color', '#000000');
            document.documentElement.style.setProperty('--ion-text-color', '#ffffff');
            document.documentElement.style.setProperty('--ion-color-step-50', '#0d0d0d');
            document.documentElement.style.setProperty('--ion-color-step-100', '#1a1a1a');
            document.documentElement.style.setProperty('--ion-color-step-150', '#262626');
            document.documentElement.style.setProperty('--ion-color-step-200', '#333333');
            document.documentElement.style.setProperty('--ion-color-step-250', '#404040');
            document.documentElement.style.setProperty('--ion-color-step-300', '#4d4d4d');
            document.documentElement.style.setProperty('--ion-color-step-350', '#595959');
            document.documentElement.style.setProperty('--ion-color-step-400', '#666666');
            document.documentElement.style.setProperty('--ion-color-step-450', '#737373');
            document.documentElement.style.setProperty('--ion-color-step-500', '#808080');
            document.documentElement.style.setProperty('--ion-color-step-550', '#8c8c8c');
            document.documentElement.style.setProperty('--ion-color-step-600', '#999999');
            document.documentElement.style.setProperty('--ion-color-step-650', '#a6a6a6');
            document.documentElement.style.setProperty('--ion-color-step-700', '#b3b3b3');
            document.documentElement.style.setProperty('--ion-color-step-750', '#bfbfbf');
            document.documentElement.style.setProperty('--ion-color-step-800', '#cccccc');
            document.documentElement.style.setProperty('--ion-color-step-850', '#d9d9d9');
            document.documentElement.style.setProperty('--ion-color-step-900', '#e6e6e6');
            document.documentElement.style.setProperty('--ion-color-step-950', '#f2f2f2');
        } else {
            // 라이트 모드 기본값으로 복원
            const lightVars = [
                '--ion-background-color',
                '--ion-text-color'
            ];
            
            lightVars.forEach(varName => {
                document.documentElement.style.removeProperty(varName);
            });
            
            // Step colors 복원
            for (let i = 50; i <= 950; i += 50) {
                document.documentElement.style.removeProperty(`--ion-color-step-${i}`);
            }
        }
    }
    
    if (theme === 'auto') {
        applyTheme(prefersDark.matches);
        prefersDark.addEventListener('change', (e) => applyTheme(e.matches));
    } else {
        applyTheme(theme === 'dark');
    }
}

/**
 * 컴포넌트가 정의될 때까지 대기
 */
export async function waitForComponent(tagName: string): Promise<void> {
    if (customElements.get(tagName)) {
        return;
    }
    
    await customElements.whenDefined(tagName);
}

/**
 * 모든 Ionic 컴포넌트 대기
 */
export async function waitForAllComponents(): Promise<void> {
    const components = [
        'ion-button', 'ion-checkbox', 'ion-toggle', 'ion-input',
        'ion-textarea', 'ion-select', 'ion-modal', 'ion-popover',
        'ion-loading', 'ion-toast', 'ion-alert', 'ion-action-sheet',
        'ion-list', 'ion-item', 'ion-card', 'ion-tabs', 'ion-segment',
        'ion-datetime', 'ion-searchbar', 'ion-range'
    ];
    
    await Promise.all(components.map(c => waitForComponent(c)));
}

/**
 * Ionic 초기화 헬퍼
 */
export async function initializeIonic(): Promise<void> {
    // Ionic config 설정
    const ionicConfig = (window as any).Ionic?.config;
    if (ionicConfig) {
        // 기본 설정
        ionicConfig.set('rippleEffect', true);
        ionicConfig.set('animated', true);
        ionicConfig.set('hardwareBackButton', true);
        ionicConfig.set('statusTap', true);
        
        // 플랫폼 감지
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        if (!ionicConfig.get('mode')) {
            ionicConfig.set('mode', isIOS ? 'ios' : 'md');
        }
    }
    
    // CSS 변수 초기화
    document.documentElement.style.setProperty('--ion-safe-area-top', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--ion-safe-area-bottom', 'env(safe-area-inset-bottom)');
    document.documentElement.style.setProperty('--ion-safe-area-left', 'env(safe-area-inset-left)');
    document.documentElement.style.setProperty('--ion-safe-area-right', 'env(safe-area-inset-right)');
}