import { AitsElement } from './AitsElement';

/**
 * AitsPagination - 페이지네이션 컴포넌트
 * <nav is="aits-pagination">
 */
export class AitsPagination extends AitsElement {
    private currentPage: number = 1;
    private totalPages: number = 1;
    
    static get observedAttributes() {
        return ['current', 'total', 'show-first-last', 'show-numbers'];
    }
    
    protected onAttributeChange(name: string, oldValue: string | null, newValue: string | null): void {
        if (name === 'current') {
            this.currentPage = parseInt(newValue || '1');
        } else if (name === 'total') {
            this.totalPages = parseInt(newValue || '1');
        }
    }
    
    protected getTemplate(): string {
        const showFirstLast = this.getBoolAttr('show-first-last');
        const showNumbers = this.getBoolAttr('show-numbers');
        
        return `
            <div class="pagination" part="container">
                ${showFirstLast ? `
                    <button class="page-first" part="first" ?disabled="${this.currentPage === 1}">
                        ⟨⟨
                    </button>
                ` : ''}
                
                <button class="page-prev" part="prev" ?disabled="${this.currentPage === 1}">
                    ⟨
                </button>
                
                ${showNumbers ? this.renderPageNumbers() : `
                    <span class="page-info" part="info">
                        ${this.currentPage} / ${this.totalPages}
                    </span>
                `}
                
                <button class="page-next" part="next" ?disabled="${this.currentPage === this.totalPages}">
                    ⟩
                </button>
                
                ${showFirstLast ? `
                    <button class="page-last" part="last" ?disabled="${this.currentPage === this.totalPages}">
                        ⟩⟩
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    private renderPageNumbers(): string {
        const pages = [];
        const maxVisible = 5;
        const halfVisible = Math.floor(maxVisible / 2);
        
        let start = Math.max(1, this.currentPage - halfVisible);
        let end = Math.min(this.totalPages, start + maxVisible - 1);
        
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(`
                <button class="page-number ${i === this.currentPage ? 'active' : ''}" 
                        part="number" 
                        data-page="${i}">
                    ${i}
                </button>
            `);
        }
        
        return pages.join('');
    }
    
    protected getStyles(): string {
        return `
            .pagination {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .pagination button {
                padding: 0.5rem 0.75rem;
                border: 1px solid var(--aits-border-color, #e5e7eb);
                background: white;
                cursor: pointer;
                border-radius: var(--aits-radius-md, 0.375rem);
                transition: all 0.2s ease;
            }
            
            .pagination button:hover:not(:disabled) {
                background: var(--aits-bg-hover, #f9fafb);
            }
            
            .pagination button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .pagination button.active {
                background: var(--aits-color-primary, #3b82f6);
                color: white;
                border-color: var(--aits-color-primary, #3b82f6);
            }
            
            .page-info {
                padding: 0.5rem 1rem;
                color: var(--aits-text-secondary, #6b7280);
            }
        `;
    }
    
    protected afterRender(): void {
        this.$$('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                
                if (target.classList.contains('page-first')) {
                    this.goToPage(1);
                } else if (target.classList.contains('page-prev')) {
                    this.goToPage(this.currentPage - 1);
                } else if (target.classList.contains('page-next')) {
                    this.goToPage(this.currentPage + 1);
                } else if (target.classList.contains('page-last')) {
                    this.goToPage(this.totalPages);
                } else if (target.classList.contains('page-number')) {
                    const page = parseInt(target.dataset.page || '1');
                    this.goToPage(page);
                }
            });
        });
    }
    
    private goToPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) {
            return;
        }
        
        const oldPage = this.currentPage;
        this.currentPage = page;
        this.setAttribute('current', String(page));
        this.render();
        
        this.emit('page-change', { 
            page, 
            previousPage: oldPage 
        });
    }
}