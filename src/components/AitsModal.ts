import { AitsElement } from './AitsElement';

/**
 * AitsModal - 모달 다이얼로그 컴포넌트
 * <dialog is="aits-modal">
 */
export class AitsModal extends AitsElement {
    static get observedAttributes() {
        return ['open', 'size', 'closable'];
    }
    
    protected getTemplate(): string {
        const size = this.getAttr('size', 'medium');
        const closable = this.getBoolAttr('closable');
        
        return `
            <div class="modal-backdrop" part="backdrop"></div>
            <div class="modal-container size-${size}" part="container">
                <div class="modal-header" part="header">
                    <slot name="header">
                        <h2 class="modal-title">Modal Title</h2>
                    </slot>
                    ${closable ? `
                        <button class="modal-close" part="close" aria-label="Close">✕</button>
                    ` : ''}
                </div>
                
                <div class="modal-body" part="body">
                    <slot></slot>
                </div>
                
                <div class="modal-footer" part="footer">
                    <slot name="footer"></slot>
                </div>
            </div>
        `;
    }
    
    protected getStyles(): string {
        return `
            :host {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9998;
            }
            
            :host([open]) {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .modal-container {
                position: relative;
                background: white;
                border-radius: var(--aits-radius-lg, 0.5rem);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(1rem);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .size-small {
                width: 90%;
                max-width: 400px;
            }
            
            .size-medium {
                width: 90%;
                max-width: 600px;
            }
            
            .size-large {
                width: 90%;
                max-width: 800px;
            }
            
            .size-full {
                width: 90%;
                max-width: 90%;
            }
            
            .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.5rem;
                border-bottom: 1px solid var(--aits-border-color, #e5e7eb);
            }
            
            .modal-title {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--aits-text-primary, #111827);
            }
            
            .modal-close {
                background: transparent;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.25rem;
                color: var(--aits-text-secondary, #6b7280);
                transition: color 0.2s ease;
            }
            
            .modal-close:hover {
                color: var(--aits-text-primary, #111827);
            }
            
            .modal-body {
                flex: 1;
                padding: 1.5rem;
                overflow-y: auto;
            }
            
            .modal-footer {
                padding: 1.5rem;
                border-top: 1px solid var(--aits-border-color, #e5e7eb);
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
            }
            
            .modal-footer:empty {
                display: none;
            }
        `;
    }
    
    protected afterRender(): void {
        const backdrop = this.$('.modal-backdrop');
        const closeBtn = this.$('.modal-close');
        
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                if (this.getBoolAttr('closable')) {
                    this.close();
                }
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }
        
        // ESC 키로 닫기
        if (this.getBoolAttr('closable')) {
            document.addEventListener('keydown', this.handleEscape);
            this.addCleanup(() => {
                document.removeEventListener('keydown', this.handleEscape);
            });
        }
    }
    
    private handleEscape = (e: KeyboardEvent): void => {
        if (e.key === 'Escape' && this.hasAttribute('open')) {
            this.close();
        }
    }
    
    public open(): void {
        this.setAttribute('open', '');
        this.emit('open');
        
        // 포커스 트랩
        const focusableElements = this.$$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
        }
    }
    
    public close(): void {
        this.removeAttribute('open');
        this.emit('close');
    }
    
    public toggle(): void {
        if (this.hasAttribute('open')) {
            this.close();
        } else {
            this.open();
        }
    }
}