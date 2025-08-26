import type { SlAlert, SlDialog, SlDrawer } from './types';

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
  alert.toast();
}

/**
 * 다이얼로그 생성
 */
export async function createDialog(options: {
  label: string;
  content: string;
  footer?: string;
}): Promise<SlDialog> {
  await ensureShoelaceLoaded();
  
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
 * 드로어(사이드바) 생성
 */
export async function createDrawer(options: {
  label: string;
  content: string;
  placement?: 'top' | 'end' | 'bottom' | 'start';
  footer?: string;
}): Promise<SlDrawer> {
  await ensureShoelaceLoaded();
  
  const drawer = document.createElement('sl-drawer') as SlDrawer;
  drawer.label = options.label;
  drawer.placement = options.placement || 'end';
  drawer.innerHTML = `
    ${options.content}
    ${options.footer ? `<div slot="footer">${options.footer}</div>` : ''}
  `;
  
  document.body.appendChild(drawer);
  return drawer;
}

/**
 * 확인 대화상자
 */
export async function confirm(
  message: string, 
  title: string = 'Confirm'
): Promise<boolean> {
  const dialog = await createDialog({
    label: title,
    content: message,
    footer: `
      <sl-button slot="footer" variant="default" data-action="cancel">Cancel</sl-button>
      <sl-button slot="footer" variant="primary" data-action="confirm">Confirm</sl-button>
    `
  });
  
  return new Promise((resolve) => {
    dialog.addEventListener('sl-request-close', (event: any) => {
      if (event.detail.source === 'overlay') {
        event.preventDefault();
      }
    });
    
    dialog.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');
      
      if (action === 'confirm') {
        dialog.hide();
        resolve(true);
      } else if (action === 'cancel') {
        dialog.hide();
        resolve(false);
      }
    });
    
    dialog.show();
  });
}

/**
 * Shoelace 로드 확인
 */
async function ensureShoelaceLoaded(): Promise<void> {
  if (!customElements.get('sl-alert')) {
    // Shoelace이 로드되지 않았으면 대기
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
 * 테마 전환
 */
export function setTheme(theme: 'light' | 'dark' | 'auto'): void {
  const root = document.documentElement;
  
  if (theme === 'auto') {
    // 시스템 테마 감지
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('sl-theme-dark', prefersDark);
  } else {
    root.classList.toggle('sl-theme-dark', theme === 'dark');
  }
}