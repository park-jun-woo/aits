import { AitsElement } from './AitsElement';

/**
 * AitsError - 에러 상태 표시 컴포넌트
 * <div is="aits-error">
 */
export class AitsError extends AitsElement {
    static get observedAttributes() {
        return ['code', 'title', 'message', 'show-details'];
    }
    
    protected getTemplate(): string {
        const code = this.getAttr('code', '');
        const title = this.getAttr('title', 'Something went wrong');
        const message = this.getAttr('message', 'An unexpected error occurred');
        const showDetails = this.getBoolAttr('show-details');
        
        return `
            <div class="error-container" part="container">
                <div class="error-icon" part="icon">
                    <slot name="icon">⚠️</slot>
                </div>
                
                ${code ? `
                    <div class="error-code" part="code">${this.escapeHtml(code)}</div>
                ` : ''}
                
                <h3 class="error-title" part="title">
                    <slot name="title">${this.escapeHtml(title)}</slot>
                </h3>
                
                <p class="error-message" part="message">
                    <slot name="message">${this.escapeHtml(message)}</slot>
                </p>
                
                ${showDetails && this.data ? `
                    <details class="error-details" part="details">
                        <summary>Technical Details</summary>
                        <pre>${this.escapeHtml(JSON.stringify(this.data, null, 2))}</pre>
                    </details>
                ` : ''}
                
                <div class="error-actions" part="actions">
                    <slot name="actions">
                        <button class="retry-button" part="retry">Try Again</button>
                    </slot>
                </div>
            </div>
        `;
    }
    
    protected getStyles(): string {
        return `
            :host {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 3rem 1rem;
                min-height: 300px;
            }
            
            .error-container {
                text-align: center;
                max-width: 500px;
            }
            
            .error-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                color: var(--aits-color-danger, #ef4444);
            }
            
            .error-code {
                display: inline-block;
                padding: 0.25rem 0.75rem;
                background: var(--aits-bg-muted, #f3f4f6);
                border-radius: var(--aits-radius-md, 0.375rem);
                font-family: monospace;
                font-size: 1.125rem;
                color: var(--aits-text-secondary, #6b7280);
                margin-bottom: 1rem;
            }
            
            .error-title {
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--aits-text-primary, #111827);
            }
            
            .error-message {
                margin: 0 0 1.5rem 0;
                color: var(--aits-text-secondary, #6b7280);
                line-height: 1.5;
            }
            
            .error-details {
                text-align: left;
                margin: 1.5rem 0;
                padding: 1rem;
                background: var(--aits-bg-muted, #f9fafb);
                border-radius: var(--aits-radius-md, 0.375rem);
            }
            
            .error-details summary {
                cursor: pointer;
                font-weight: 500;
                margin-bottom: 0.5rem;
            }
            
            .error-details pre {
                margin: 0.5rem 0 0 0;
                font-size: 0.75rem;
                overflow-x: auto;
            }
            
            .retry-button {
                padding: 0.5rem 1.5rem;
                background: var(--aits-color-primary, #3b82f6);
                color: white;
                border: none;
                border-radius: var(--aits-radius-md, 0.375rem);
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .retry-button:hover {
                background: var(--aits-color-primary-dark, #2563eb);
            }
        `;
    }
    
    protected afterRender(): void {
        const retryBtn = this.$('.retry-button') as HTMLButtonElement;
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.emit('retry');
            });
        }
    }
}