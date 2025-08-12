import { AitsElement } from './AitsElement';

/**
 * AitsToast - 토스트 알림 컴포넌트
 * <div is="aits-toast">
 */
export class AitsToast extends AitsElement {
    private autoCloseTimer: number | null = null;
    
    static get observedAttributes() {
        return ['variant', 'position', 'duration', 'closable'];
    }
    
    protected getTemplate(): string {
        const variant = this.getAttr('variant', 'info');
        const closable = this.getBoolAttr('closable');
        
        const icons: Record<string, string> = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        return `
            <div class="toast toast-${variant}" part="container">
                <span class="toast-icon" part="icon">${icons[variant] || icons.info}</span>
                <div class="toast-content" part="content">
                    <slot></slot>
                </div>
                ${closable ? `
                    <button class="toast-close" part="close" aria-label="Close">✕</button>
                ` : ''}
            </div>
        `;
    }
    
    protected getStyles(): string {
        const position = this.getAttr('position', 'top-right');
        const positions: Record<string, string> = {
            'top-left': 'top: 1rem; left: 1rem;',
            'top-center': 'top: 1rem; left: 50%; transform: translateX(-50%);',
            'top-right': 'top: 1rem; right: 1rem;',
            'bottom-left': 'bottom: 1rem; left: 1rem;',
            'bottom-center': 'bottom: 1rem; left: 50%; transform: translateX(-50%);',
            'bottom-right': 'bottom: 1rem; right: 1rem;'
        };
        
        return `
            :host {
                position: fixed;
                ${positions[position] || positions['top-right']}
                z-index: 9999;
                pointer-events: none;
            }
            
            .toast {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
                background: white;
                border-radius: var(--aits-radius-md, 0.375rem);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                pointer-events: auto;
                animation: slideIn 0.3s ease;
                max-width: 400px;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-1rem);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .toast-info {
                border-left: 4px solid var(--aits-color-info, #3b82f6);
            }
            
            .toast-success {
                border-left: 4px solid var(--aits-color-success, #10b981);
            }
            
            .toast-warning {
                border-left: 4px solid var(--aits-color-warning, #f59e0b);
            }
            
            .toast-error {
                border-left: 4px solid var(--aits-color-error, #ef4444);
            }
            
            .toast-icon {
                font-size: 1.25rem;
                flex-shrink: 0;
            }
            
            .toast-content {
                flex: 1;
                color: var(--aits-text-primary, #111827);
            }
            
            .toast-close {
                background: transparent;
                border: none;
                font-size: 1.25rem;
                cursor: pointer;
                padding: 0.25rem;
                color: var(--aits-text-secondary, #6b7280);
                transition: color 0.2s ease;
            }
            
            .toast-close:hover {
                color: var(--aits-text-primary, #111827);
            }
        `;
    }
    
    protected afterRender(): void {
        const closeBtn = this.$('.toast-close') as HTMLButtonElement;
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }
        
        // 자동 닫기
        const duration = this.getNumberAttr('duration', 5000);
        if (duration > 0) {
            this.autoCloseTimer = window.setTimeout(() => {
                this.close();
            }, duration);
        }
    }
    
    public close(): void {
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
        }
        
        this.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            this.remove();
        }, 300);
    }
    
    public static show(message: string, options: {
        variant?: string;
        duration?: number;
        position?: string;
        closable?: boolean;
    } = {}): AitsToast {
        const toast = document.createElement('div') as any;
        toast.setAttribute('is', 'aits-toast');
        
        if (options.variant) toast.setAttribute('variant', options.variant);
        if (options.duration !== undefined) toast.setAttribute('duration', String(options.duration));
        if (options.position) toast.setAttribute('position', options.position);
        if (options.closable) toast.setAttribute('closable', '');
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        return toast as AitsToast;
    }
}