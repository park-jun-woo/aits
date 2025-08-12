import { AitsElement } from './AitsElement';

/**
 * AitsSearch - 검색 컴포넌트
 * <div is="aits-search">
 */
export class AitsSearch extends AitsElement {
    private searchValue: string = '';
    private debounceTimer: number | null = null;
    
    static get observedAttributes() {
        return ['placeholder', 'debounce', 'instant'];
    }
    
    protected getTemplate(): string {
        const placeholder = this.getAttr('placeholder', 'Search...');
        
        return `
            <div class="search-container" part="container">
                <input type="search" 
                       class="search-input" 
                       part="input"
                       placeholder="${placeholder}"
                       value="${this.searchValue}">
                <button class="search-button" part="button">
                    <slot name="icon">🔍</slot>
                </button>
                <button class="search-clear" part="clear" ?hidden="${!this.searchValue}">
                    ✕
                </button>
            </div>
        `;
    }
    
    protected getStyles(): string {
        return `
            .search-container {
                display: flex;
                align-items: center;
                position: relative;
                border: 1px solid var(--aits-border-color, #e5e7eb);
                border-radius: var(--aits-radius-md, 0.375rem);
                overflow: hidden;
                transition: all 0.2s ease;
            }
            
            .search-container:focus-within {
                border-color: var(--aits-color-primary, #3b82f6);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .search-input {
                flex: 1;
                border: none;
                padding: 0.5rem 1rem;
                font-size: 1rem;
                background: transparent;
                outline: none;
            }
            
            .search-button,
            .search-clear {
                background: transparent;
                border: none;
                padding: 0.5rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .search-button:hover,
            .search-clear:hover {
                background: var(--aits-bg-hover, #f9fafb);
            }
            
            .search-clear[hidden] {
                display: none;
            }
        `;
    }
    
    protected afterRender(): void {
        const input = this.$('.search-input') as HTMLInputElement;
        const button = this.$('.search-button') as HTMLButtonElement;
        const clear = this.$('.search-clear') as HTMLButtonElement;
        
        if (input) {
            // 즉시 검색 모드
            if (this.getBoolAttr('instant')) {
                input.addEventListener('input', () => {
                    this.handleSearch(input.value);
                });
            } else {
                // 엔터키로 검색
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performSearch(input.value);
                    }
                });
            }
        }
        
        if (button) {
            button.addEventListener('click', () => {
                this.performSearch(input?.value || '');
            });
        }
        
        if (clear) {
            clear.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }
    
    private handleSearch(value: string): void {
        this.searchValue = value;
        
        // 디바운싱
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        const delay = this.getNumberAttr('debounce', 300);
        this.debounceTimer = window.setTimeout(() => {
            this.performSearch(value);
        }, delay);
    }
    
    private performSearch(query: string): void {
        this.searchValue = query;
        this.render();
        this.emit('search', { query });
    }
    
    private clearSearch(): void {
        this.searchValue = '';
        this.render();
        this.emit('clear');
        this.emit('search', { query: '' });
    }
}