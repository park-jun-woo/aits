import { AitsElement } from './AitsElement';

/**
 * AitsCard - 카드 형태의 데이터 컨테이너
 * <div is="aits-card">
 */
export class AitsCard extends AitsElement {
    static get observedAttributes() {
        return ['variant', 'shadow', 'clickable', 'horizontal'];
    }
    
    protected getTemplate(): string {
        const isHorizontal = this.getBoolAttr('horizontal');
        const isClickable = this.getBoolAttr('clickable');
        
        return `
            <div class="card-container ${isHorizontal ? 'horizontal' : ''} ${isClickable ? 'clickable' : ''}" 
                 part="container">
                ${this.data?.image ? `
                    <div class="card-image" part="image">
                        <img src="${this.escapeHtml(this.data.image)}" 
                             alt="${this.escapeHtml(this.data.imageAlt || '')}" />
                    </div>
                ` : ''}
                
                <div class="card-content" part="content">
                    <slot name="header">
                        ${this.data?.title ? `
                            <h3 class="card-title" part="title">
                                ${this.escapeHtml(this.data.title)}
                            </h3>
                        ` : ''}
                    </slot>
                    
                    <slot name="body">
                        ${this.data?.description ? `
                            <p class="card-description" part="description">
                                ${this.escapeHtml(this.data.description)}
                            </p>
                        ` : ''}
                    </slot>
                    
                    <slot name="footer">
                        ${this.data?.footer ? `
                            <div class="card-footer" part="footer">
                                ${this.data.footer}
                            </div>
                        ` : ''}
                    </slot>
                </div>
            </div>
        `;
    }
    
    protected getStyles(): string {
        const shadow = this.getAttr('shadow', 'medium');
        const shadowValues: Record<string, string> = {
            none: 'none',
            small: '0 1px 3px rgba(0,0,0,0.12)',
            medium: '0 4px 6px rgba(0,0,0,0.1)',
            large: '0 10px 15px rgba(0,0,0,0.1)'
        };
        
        return `
            .card-container {
                background: var(--aits-card-bg, white);
                border-radius: var(--aits-radius-lg, 0.75rem);
                border: 1px solid var(--aits-border-color, #e5e7eb);
                box-shadow: ${shadowValues[shadow] || shadowValues.medium};
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .card-container.horizontal {
                display: flex;
                flex-direction: row;
            }
            
            .card-container.clickable {
                cursor: pointer;
            }
            
            .card-container.clickable:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 20px rgba(0,0,0,0.15);
            }
            
            .card-image {
                flex-shrink: 0;
            }
            
            .horizontal .card-image {
                width: 40%;
                max-width: 200px;
            }
            
            .card-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .card-content {
                padding: var(--aits-spacing-lg, 1.5rem);
                flex: 1;
            }
            
            .card-title {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--aits-text-primary, #111827);
                margin: 0 0 0.5rem 0;
            }
            
            .card-description {
                color: var(--aits-text-secondary, #6b7280);
                line-height: 1.5;
                margin: 0 0 1rem 0;
            }
            
            .card-footer {
                padding-top: 1rem;
                border-top: 1px solid var(--aits-border-color, #e5e7eb);
            }
        `;
    }
    
    protected afterRender(): void {
        if (this.getBoolAttr('clickable')) {
            this.$('.card-container')?.addEventListener('click', () => {
                this.emit('card-click', { data: this.data });
            });
        }
    }
}