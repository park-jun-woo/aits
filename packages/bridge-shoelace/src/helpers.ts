import type { SlAlert, SlDialog, SlDrawer } from './types';

/**
 * Shoelace 컴포넌트가 로드될 때까지 대기
 */
async function ensureShoelaceLoaded(): Promise<void> {
  if (!customElements.get('sl-alert')) {
    await new Promise<void>((resolve) => {
      const check = () => {
        if (customElements.get('sl-alert')) {
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
 * 토스트 알림 표시
 */
export async function toast(
  message: string, 
  variant: 'primary' | 'success' | 'neutral' | 'warning' | 'danger' = 'primary',
  duration: number = 3000,
  icon?: string
): Promise<void> {
  await ensureShoelaceLoaded();
  
  const alert = document.createElement('sl-alert') as SlAlert;
  alert.variant = variant;
  alert.closable = true;
  alert.duration = duration;
  
  const iconHtml = icon ? `<sl-icon slot="icon" name="${icon}"></sl-icon>` : '';
  alert.innerHTML = `${iconHtml}${message}`;
  
  document.body.appendChild(alert);
  await customElements.whenDefined('sl-alert');
  alert.toast();
}

/**
 * 다이얼로그 생성
 */
export async function createDialog(options: {
  label: string;
  content: string;
  footer?: string;
  width?: string;
}): Promise<SlDialog> {
  await ensureShoelaceLoaded();
  
  const dialog = document.createElement('sl-dialog') as SlDialog;
  dialog.label = options.label;
  
  if (options.width) {
    dialog.style.setProperty('--width', options.width);
  }
  
  dialog.innerHTML = `
    ${options.content}
    ${options.footer ? `<div slot="footer">${options.footer}</div>` : ''}
  `;
  
  document.body.appendChild(dialog);
  await customElements.whenDefined('sl-dialog');
  
  return dialog;
}

/**
 * 드로어 생성
 */
export async function createDrawer(options: {
  label: string;
  content: string;
  placement?: 'top' | 'end' | 'bottom' | 'start';
  footer?: string;
  size?: 'small' | 'medium' | 'large';
}): Promise<SlDrawer> {
  await ensureShoelaceLoaded();
  
  const drawer = document.createElement('sl-drawer') as SlDrawer;
  drawer.label = options.label;
  drawer.placement = options.placement || 'end';
  
  if (options.size) {
    drawer.style.setProperty('--size', 
      options.size === 'small' ? '20rem' :
      options.size === 'large' ? '40rem' : '30rem'
    );
  }
  
  drawer.innerHTML = `
    ${options.content}
    ${options.footer ? `<div slot="footer">${options.footer}</div>` : ''}
  `;
  
  document.body.appendChild(drawer);
  await customElements.whenDefined('sl-drawer');
  
  return drawer;
}

/**
 * 확인 대화상자
 */
export async function confirm(
  message: string, 
  title: string = 'Confirm',
  confirmText: string = 'Confirm',
  cancelText: string = 'Cancel'
): Promise<boolean> {
  const dialog = await createDialog({
    label: title,
    content: `<p>${message}</p>`,
    footer: `
      <sl-button slot="footer" variant="default" data-action="cancel">${cancelText}</sl-button>
      <sl-button slot="footer" variant="primary" data-action="confirm">${confirmText}</sl-button>
    `
  });
  
  return new Promise((resolve) => {
    dialog.addEventListener('sl-request-close', (event: any) => {
      if (event.detail.source === 'overlay') {
        event.preventDefault();
      }
    });
    
    dialog.addEventListener('click', async (event: Event) => {
      const target = event.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');
      
      if (action === 'confirm') {
        await dialog.hide();
        dialog.remove();
        resolve(true);
      } else if (action === 'cancel') {
        await dialog.hide();
        dialog.remove();
        resolve(false);
      }
    });
    
    dialog.show();
  });
}

/**
 * 프롬프트 다이얼로그
 */
export async function prompt(
  message: string,
  title: string = 'Input',
  defaultValue: string = '',
  placeholder: string = ''
): Promise<string | null> {
  const dialog = await createDialog({
    label: title,
    content: `
      <p>${message}</p>
      <sl-input id="prompt-input" value="${defaultValue}" placeholder="${placeholder}"></sl-input>
    `,
    footer: `
      <sl-button slot="footer" variant="default" data-action="cancel">Cancel</sl-button>
      <sl-button slot="footer" variant="primary" data-action="confirm">OK</sl-button>
    `
  });
  
  return new Promise((resolve) => {
    const input = dialog.querySelector('#prompt-input') as any;
    
    dialog.addEventListener('sl-after-show', () => {
      input?.focus();
    });
    
    dialog.addEventListener('click', async (event: Event) => {
      const target = event.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');
      
      if (action === 'confirm') {
        const value = input?.value || '';
        await dialog.hide();
        dialog.remove();
        resolve(value);
      } else if (action === 'cancel') {
        await dialog.hide();
        dialog.remove();
        resolve(null);
      }
    });
    
    dialog.show();
  });
}

/**
 * 테마 전환
 */
export function setTheme(theme: 'light' | 'dark' | 'auto'): void {
  const root = document.documentElement;
  
  // 기존 클래스 제거
  root.classList.remove('sl-theme-light', 'sl-theme-dark');
  
  if (theme === 'auto') {
    // 시스템 테마 감지
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'sl-theme-dark' : 'sl-theme-light');
    
    // 시스템 테마 변경 감지
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      root.classList.remove('sl-theme-light', 'sl-theme-dark');
      root.classList.add(e.matches ? 'sl-theme-dark' : 'sl-theme-light');
    });
  } else {
    root.classList.add(`sl-theme-${theme}`);
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
 * 모든 Shoelace 컴포넌트 대기
 */
export async function waitForAllComponents(): Promise<void> {
  const components = [
    'sl-alert', 'sl-button', 'sl-input', 'sl-dialog',
    'sl-drawer', 'sl-dropdown', 'sl-select', 'sl-checkbox',
    'sl-switch', 'sl-textarea', 'sl-radio', 'sl-tab-group',
    'sl-card', 'sl-badge', 'sl-spinner', 'sl-tooltip'
  ];
  
  await Promise.all(components.map(c => waitForComponent(c)));
}