/**
 * =================================================================
 * AitsToast.ts - 토스트 알림 컴포넌트 (개선된 버전)
 * =================================================================
 * @description
 * - 타이머 관리 개선
 * - 생명주기 중복 호출 방지
 * @author Aits Framework AI
 * @version 1.1.0
 */

import { AitsElement } from './AitsElement';

export class AitsToast extends AitsElement {
    private autoCloseTimer: number | null = null;
    private animationTimer: number | null = null;
    private isClosing: boolean = false;
    
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
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-0.5rem);
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
        // 이벤트 핸들러를 중복 방지 방식으로 등록
        this.bindEventHandler('.toast-close', 'click', 'handleCloseClick');
        
        // 자동 닫기 설정
        this.setupAutoClose();
    }
    
    private handleCloseClick = (): void => {
        this.close();
    }
    
    /**
     * 자동 닫기 설정
     */
    private setupAutoClose(): void {
        this.clearTimers();
        
        const duration = this.getNumberAttr('duration', 5000);
        if (duration > 0) {
            this.autoCloseTimer = window.setTimeout(() => {
                this.close();
            }, duration);
        }
    }
    
    /**
     * 모든 타이머 정리
     */
    private clearTimers(): void {
        if (this.autoCloseTimer !== null) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
        
        if (this.animationTimer !== null) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }
    }
    
    /**
     * 토스트 닫기
     */
    public close(): void {
        if (this.isClosing) return; // 중복 닫기 방지
        this.isClosing = true;
        
        this.clearTimers();
        
        const cancelled = !this.emit('closing', {}, { cancelable: true });
        if (cancelled) {
            this.isClosing = false;
            return;
        }
        
        this.style.animation = 'fadeOut 0.3s ease forwards';
        
        this.animationTimer = window.setTimeout(() => {
            this.emit('closed');
            this.remove();
        }, 300);
    }
    
    /**
     * 연결 해제 전 처리
     */
    protected beforeDisconnect(): void {
        this.clearTimers();
    }
    
    /**
     * 정적 메서드: 토스트 표시
     */
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
        if (options.closable !== undefined) toast.setAttribute('closable', String(options.closable));
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        return toast as AitsToast;
    }
    
    public static success(message: string, options?: Omit<Parameters<typeof AitsToast.show>[1], 'variant'>): AitsToast {
        return this.show(message, { ...options, variant: 'success' });
    }
    
    public static error(message: string, options?: Omit<Parameters<typeof AitsToast.show>[1], 'variant'>): AitsToast {
        return this.show(message, { ...options, variant: 'error' });
    }
    
    public static warning(message: string, options?: Omit<Parameters<typeof AitsToast.show>[1], 'variant'>): AitsToast {
        return this.show(message, { ...options, variant: 'warning' });
    }
    
    public static info(message: string, options?: Omit<Parameters<typeof AitsToast.show>[1], 'variant'>): AitsToast {
        return this.show(message, { ...options, variant: 'info' });
    }
    
    public static closeAll(): void {
        const toasts = document.querySelectorAll('[is="aits-toast"]');
        toasts.forEach(toast => {
            if (toast instanceof AitsToast) {
                toast.close();
            }
        });
    }
}