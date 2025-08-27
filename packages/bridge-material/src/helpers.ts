import type { 
    MdDialog, 
    MdMenu, 
    MdTextField,
    MdButton
} from './types';

/**
 * Material 컴포넌트가 로드될 때까지 대기
 */
async function ensureMaterialLoaded(): Promise<void> {
    if (!customElements.get('md-dialog')) {
        await new Promise<void>((resolve) => {
            const check = () => {
                if (customElements.get('md-dialog')) {
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
 * Material Design 토스트/스낵바 표시
 */
export async function showSnackbar(
    message: string,
    action?: string,
    duration: number = 3000
): Promise<void> {
    await ensureMaterialLoaded();
    
    const snackbar = document.createElement('div');
    snackbar.className = 'md-snackbar';
    snackbar.style.cssText = `
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--md-sys-color-inverse-surface, #1f1f1f);
        color: var(--md-sys-color-inverse-on-surface, #f1f1f1);
        padding: 14px 16px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 9999;
        animation: slideUp 0.3s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { transform: translate(-50%, 100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slideDown {
            from { transform: translate(-50%, 0); opacity: 1; }
            to { transform: translate(-50%, 100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    snackbar.innerHTML = `
        <span>${message}</span>
        ${action ? `<md-text-button style="color: var(--md-sys-color-inverse-primary)">${action}</md-text-button>` : ''}
    `;
    
    document.body.appendChild(snackbar);
    
    if (action) {
        const actionButton = snackbar.querySelector('md-text-button');
        actionButton?.addEventListener('click', () => {
            snackbar.style.animation = 'slideDown 0.3s ease-in';
            setTimeout(() => {
                snackbar.remove();
                style.remove();
            }, 300);
        });
    }
    
    setTimeout(() => {
        snackbar.style.animation = 'slideDown 0.3s ease-in';
        setTimeout(() => {
            snackbar.remove();
            style.remove();
        }, 300);
    }, duration);
}

/**
 * Material 다이얼로그 생성
 */
export async function createDialog(options: {
    headline?: string;
    content: string;
    actions?: Array<{
        text: string;
        value?: string;
        variant?: 'text' | 'filled' | 'outlined' | 'tonal';
    }>;
    type?: 'alert';
    noFocusTrap?: boolean;
}): Promise<MdDialog> {
    await ensureMaterialLoaded();
    
    const dialog = document.createElement('md-dialog') as MdDialog;
    
    if (options.type) dialog.type = options.type;
    if (options.noFocusTrap) dialog.noFocusTrap = true;
    
    const headlineHtml = options.headline ? `
        <div slot="headline">${options.headline}</div>
    ` : '';
    
    const actionsHtml = options.actions ? `
        <div slot="actions">
            ${options.actions.map(action => {
                const variant = action.variant || 'text';
                const tag = variant === 'text' ? 'md-text-button' : 
                           variant === 'filled' ? 'md-filled-button' :
                           variant === 'outlined' ? 'md-outlined-button' :
                           'md-filled-tonal-button';
                return `<${tag} value="${action.value || action.text}">${action.text}</${tag}>`;
            }).join('')}
        </div>
    ` : '';
    
    dialog.innerHTML = `
        ${headlineHtml}
        <div slot="content">${options.content}</div>
        ${actionsHtml}
    `;
    
    document.body.appendChild(dialog);
    await customElements.whenDefined('md-dialog');
    
    return dialog;
}

/**
 * 확인 다이얼로그
 */
export async function confirm(
    message: string,
    title?: string,
    confirmText: string = 'OK',
    cancelText: string = 'Cancel'
): Promise<boolean> {
    const dialog = await createDialog({
        headline: title,
        content: message,
        actions: [
            { text: cancelText, value: 'cancel', variant: 'text' },
            { text: confirmText, value: 'confirm', variant: 'filled' }
        ]
    });
    
    return new Promise((resolve) => {
        dialog.addEventListener('close', () => {
            const result = dialog.returnValue === 'confirm';
            dialog.remove();
            resolve(result);
        });
        
        dialog.show();
    });
}

/**
 * 입력 다이얼로그
 */
export async function prompt(
    message: string,
    title?: string,
    defaultValue: string = '',
    placeholder: string = ''
): Promise<string | null> {
    await ensureMaterialLoaded();
    
    const dialog = document.createElement('md-dialog') as MdDialog;
    
    dialog.innerHTML = `
        ${title ? `<div slot="headline">${title}</div>` : ''}
        <form slot="content" id="prompt-form" method="dialog">
            <p>${message}</p>
            <md-outlined-text-field
                id="prompt-input"
                value="${defaultValue}"
                placeholder="${placeholder}"
                style="width: 100%;"
            ></md-outlined-text-field>
        </form>
        <div slot="actions">
            <md-text-button value="cancel">Cancel</md-text-button>
            <md-filled-button value="ok">OK</md-filled-button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    await customElements.whenDefined('md-dialog');
    await customElements.whenDefined('md-outlined-text-field');
    
    return new Promise((resolve) => {
        const input = dialog.querySelector('#prompt-input') as MdTextField;
        
        dialog.addEventListener('closed', () => {
            if (dialog.returnValue === 'ok') {
                resolve(input.value);
            } else {
                resolve(null);
            }
            dialog.remove();
        });
        
        // Focus on input after dialog opens
        dialog.addEventListener('opened', () => {
            input?.focus();
        });
        
        dialog.show();
    });
}

/**
 * 메뉴 생성
 */
export async function createMenu(options: {
    anchor: HTMLElement | string;
    items: Array<{
        text: string;
        value?: string;
        leadingIcon?: string;
        trailingIcon?: string;
        disabled?: boolean;
        divider?: boolean;
    }>;
    positioning?: 'absolute' | 'fixed';
}): Promise<MdMenu> {
    await ensureMaterialLoaded();
    
    const menu = document.createElement('md-menu') as MdMenu;
    
    menu.anchor = options.anchor;
    if (options.positioning) menu.positioning = options.positioning;
    
    menu.innerHTML = options.items.map(item => {
        if (item.divider) {
            return '<md-divider></md-divider>';
        }
        
        const leadingIcon = item.leadingIcon ? 
            `<md-icon slot="start">${item.leadingIcon}</md-icon>` : '';
        const trailingIcon = item.trailingIcon ? 
            `<md-icon slot="end">${item.trailingIcon}</md-icon>` : '';
        
        return `
            <md-menu-item
                ${item.value ? `value="${item.value}"` : ''}
                ${item.disabled ? 'disabled' : ''}
            >
                ${leadingIcon}
                <div slot="headline">${item.text}</div>
                ${trailingIcon}
            </md-menu-item>
        `;
    }).join('');
    
    document.body.appendChild(menu);
    await customElements.whenDefined('md-menu');
    
    return menu;
}

/**
 * 테마 모드 설정
 */
export function setTheme(mode: 'light' | 'dark' | 'auto'): void {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('md-theme-light', 'md-theme-dark');
    
    if (mode === 'auto') {
        // 시스템 테마 감지
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(prefersDark ? 'md-theme-dark' : 'md-theme-light');
        
        // 시스템 테마 변경 감지
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            root.classList.remove('md-theme-light', 'md-theme-dark');
            root.classList.add(e.matches ? 'md-theme-dark' : 'md-theme-light');
        });
    } else {
        root.classList.add(`md-theme-${mode}`);
    }
}

/**
 * Material You 동적 색상 적용
 */
export async function applyDynamicColors(sourceColor: string): Promise<void> {
    // Material You 색상 생성 (간단한 구현)
    const root = document.documentElement;
    
    // HEX to RGB
    const hex = sourceColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // 기본 색상 설정
    root.style.setProperty('--md-sys-color-primary', sourceColor);
    root.style.setProperty('--md-sys-color-primary-container', adjustColor(sourceColor, 0.2));
    root.style.setProperty('--md-sys-color-on-primary', getContrastColor(sourceColor));
    root.style.setProperty('--md-sys-color-on-primary-container', adjustColor(sourceColor, -0.4));
    
    // 보조 색상
    const secondaryColor = rotateHue(sourceColor, 120);
    root.style.setProperty('--md-sys-color-secondary', secondaryColor);
    root.style.setProperty('--md-sys-color-secondary-container', adjustColor(secondaryColor, 0.2));
    
    // 3차 색상
    const tertiaryColor = rotateHue(sourceColor, 240);
    root.style.setProperty('--md-sys-color-tertiary', tertiaryColor);
    root.style.setProperty('--md-sys-color-tertiary-container', adjustColor(tertiaryColor, 0.2));
}

/**
 * 색상 조정 헬퍼
 */
function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount * 255));
    const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount * 255));
    const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount * 255));
    
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

/**
 * 대비 색상 가져오기
 */
function getContrastColor(color: string): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // 밝기 계산
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 128 ? '#000000' : '#ffffff';
}

/**
 * Hue 회전
 */
function rotateHue(color: string, degrees: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    // Rotate hue
    h = (h * 360 + degrees) % 360 / 360;
    
    // HSL to RGB
    function hue2rgb(p: number, q: number, t: number): number {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    const newR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const newG = Math.round(hue2rgb(p, q, h) * 255);
    const newB = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
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
 * 모든 Material 컴포넌트 대기
 */
export async function waitForAllComponents(): Promise<void> {
    const components = [
        'md-dialog', 'md-filled-button', 'md-outlined-button', 'md-text-button',
        'md-checkbox', 'md-switch', 'md-radio',
        'md-filled-text-field', 'md-outlined-text-field',
        'md-filled-select', 'md-outlined-select',
        'md-menu', 'md-menu-item',
        'md-chip-set', 'md-assist-chip', 'md-filter-chip',
        'md-tabs', 'md-primary-tab', 'md-secondary-tab',
        'md-fab', 'md-slider',
        'md-linear-progress', 'md-circular-progress'
    ];
    
    await Promise.all(components.map(c => waitForComponent(c)));
}