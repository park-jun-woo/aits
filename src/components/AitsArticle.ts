import { AitsElement } from './AitsElement';

/**
 * AitsArticle - 단일 콘텐츠를 표시하는 컴포넌트
 * <article is="aits-article">
 */
export class AitsArticle extends AitsElement {
    static get observedAttributes() {
        return ['variant', 'compact'];
    }
    
    protected getTemplate(): string {
        const isCompact = this.getBoolAttr('compact');
        
        if (!this.data) {
            return this.getEmptyTemplate();
        }
        
        return `
            <div class="article-container ${isCompact ? 'compact' : ''}" part="container">
                ${this.data.image ? `
                    <div class="article-image" part="image">
                        <img src="${this.escapeHtml(this.data.image)}" 
                             alt="${this.escapeHtml(this.data.imageAlt || '')}" />
                    </div>
                ` : ''}
                
                <div class="article-content" part="content">
                    ${this.data.category ? `
                        <div class="article-category" part="category">
                            ${this.escapeHtml(this.data.category)}
                        </div>
                    ` : ''}
                    
                    ${this.data.title ? `
                        <h1 class="article-title" part="title">
                            ${this.escapeHtml(this.data.title)}
                        </h1>
                    ` : ''}
                    
                    ${this.data.author || this.data.date ? `
                        <div class="article-meta" part="meta">
                            ${this.data.author ? `
                                <span class="article-author">${this.escapeHtml(this.data.author)}</span>
                            ` : ''}
                            ${this.data.date ? `
                                <time class="article-date">${this.escapeHtml(this.data.date)}</time>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    ${this.data.content ? `
                        <div class="article-body" part="body">
                            ${this.data.content}
                        </div>
                    ` : ''}
                    
                    ${this.data.tags && this.data.tags.length > 0 ? `
                        <div class="article-tags" part="tags">
                            ${this.data.tags.map((tag: string) => `
                                <span class="tag">${this.escapeHtml(tag)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <slot name="actions"></slot>
            </div>
        `;
    }
    
    protected getStyles(): string {
        return `
            .article-container {
                display: flex;
                flex-direction: column;
                gap: var(--aits-spacing-lg, 1.5rem);
            }
            
            .article-container.compact {
                gap: var(--aits-spacing-sm, 0.5rem);
            }
            
            .article-image img {
                width: 100%;
                height: auto;
                border-radius: var(--aits-radius-md, 0.5rem);
                object-fit: cover;
            }
            
            .article-category {
                color: var(--aits-color-primary, #3b82f6);
                font-size: 0.875rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 0.5rem;
            }
            
            .article-title {
                font-size: 2rem;
                font-weight: 700;
                color: var(--aits-text-primary, #111827);
                margin: 0 0 1rem 0;
                line-height: 1.2;
            }
            
            .compact .article-title {
                font-size: 1.5rem;
            }
            
            .article-meta {
                display: flex;
                gap: 1rem;
                color: var(--aits-text-secondary, #6b7280);
                font-size: 0.875rem;
                margin-bottom: 1.5rem;
            }
            
            .article-body {
                color: var(--aits-text-primary, #111827);
                line-height: 1.75;
            }
            
            .article-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 1.5rem;
            }
            
            .tag {
                display: inline-block;
                padding: 0.25rem 0.75rem;
                background: var(--aits-bg-muted, #f3f4f6);
                color: var(--aits-text-secondary, #6b7280);
                border-radius: var(--aits-radius-full, 9999px);
                font-size: 0.75rem;
            }
        `;
    }
}