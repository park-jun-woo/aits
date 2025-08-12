import { AitsElement, ComponentSize, ComponentVariant } from './AitsElement';

/**
 * AitsButton - 버튼 컴포넌트
 * <button is="aits-button">
 */
export class AitsButton extends AitsElement {
    static get observedAttributes() {
        return ['variant', 'size', 'loading', 'disabled', 'full-width'];
    }
    
    protected getTemplate(): string {
        const variant = this.getAttr('variant', 'primary') as ComponentVariant;
        const size = this.getAttr('size', 'medium') as ComponentSize;
        const isLoading = this.getBoolAttr('loading');
        const isFullWidth = this.getBoolAttr('full-width');
        
        return `
            <button class="btn btn-${variant} btn-${size} ${isFullWidth ? 'full-width' : ''}" 
                    part="button"
                    ?disabled="${this.state.disabled || isLoading}">
                ${isLoading ? '<span class="spinner"></span>' : ''}
                <span class="btn-content" part="content">
                    <slot></slot>
                </span>
            </button>
        `;
    }
    
    protected getStyles(): string {
        return `
            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                border: none;
                border-radius: var(--aits-radius-md, 0.375rem);
                font-family: inherit;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            }
            
            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .btn.full-width {
                width: 100%;
            }
            
            /* Sizes */
            .btn-small {
                padding: 0.375rem 0.75rem;
                font-size: 0.875rem;
            }
            
            .btn-medium {
                padding: 0.5rem 1rem;
                font-size: 1rem;
            }
            
            .btn-large {
                padding: 0.75rem 1.5rem;
                font-size: 1.125rem;
            }
            
            /* Variants */
            .btn-primary {
                background: var(--aits-color-primary, #3b82f6);
                color: white;
            }
            
            .btn-primary:hover:not(:disabled) {
                background: var(--aits-color-primary-dark, #2563eb);
            }
            
            .btn-secondary {
                background: var(--aits-color-secondary, #64748b);
                color: white;
            }
            
            .btn-secondary:hover:not(:disabled) {
                background: var(--aits-color-secondary-dark, #475569);
            }
            
            .btn-success {
                background: var(--aits-color-success, #10b981);
                color: white;
            }
            
            .btn-danger {
                background: var(--aits-color-danger, #ef4444);
                color: white;
            }
            
            .btn-neutral {
                background: var(--aits-color-neutral, #f3f4f6);
                color: var(--aits-text-primary, #111827);
            }
            
            /* Loading spinner */
            .spinner {
                width: 1em;
                height: 1em;
                border: 2px solid currentColor;
                border-right-color: transparent;
                border-radius: 50%;
                animation: spin 0.6s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
    }
    
    protected afterRender(): void {
        const btn = this.$('button') as HTMLButtonElement;
        if (btn) {
            btn.addEventListener('click', (e) => {
                if (!this.state.disabled && !this.getBoolAttr('loading')) {
                    this.emit('click', { originalEvent: e });
                }
            });
        }
    }
}