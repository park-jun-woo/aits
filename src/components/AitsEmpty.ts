import { AitsElement } from './AitsElement';

/**
 * AitsEmpty - 빈 상태 표시 컴포넌트
 * <div is="aits-empty">
 */
export class AitsEmpty extends AitsElement {
    static get observedAttributes() {
        return ['icon', 'title', 'description'];
    }
    
    protected getTemplate(): string {
        const icon = this.getAttr('icon', '📭');
        const title = this.getAttr('title', 'No data');
        const description = this.getAttr('description', '');
        
        return `
            <div class="empty-container" part="container">
                <div class="empty-icon" part="icon">
                    <slot name="icon">${icon}</slot>
                </div>
                
                <h3 class="empty-title" part="title">
                    <slot name="title">${this.escapeHtml(title)}</slot>
                </h3>
                
                ${description ? `
                    <p class="empty-description" part="description">
                        <slot name="description">${this.escapeHtml(description)}</slot>
                    </p>
                ` : ''}
                
                <div class="empty-actions" part="actions">
                    <slot name="actions"></slot>
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
            
            .empty-container {
                text-align: center;
                max-width: 400px;
            }
            
            .empty-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                opacity: 0.5;
            }
            
            .empty-title {
                margin: 0 0 0.5rem 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--aits-text-primary, #111827);
            }
            
            .empty-description {
                margin: 0 0 1.5rem 0;
                color: var(--aits-text-secondary, #6b7280);
                line-height: 1.5;
            }
            
            .empty-actions:empty {
                display: none;
            }
        `;
    }
}