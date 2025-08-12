import { AitsElement } from './AitsElement';

/**
 * AitsFilter - 필터 컴포넌트
 * <div is="aits-filter">
 */
export class AitsFilter extends AitsElement {
    private filters: Record<string, any> = {};
    
    static get observedAttributes() {
        return ['variant', 'layout'];
    }
    
    protected getTemplate(): string {
        const layout = this.getAttr('layout', 'horizontal');
        
        return `
            <div class="filter-container layout-${layout}" part="container">
                <slot name="filters"></slot>
                <div class="filter-actions" part="actions">
                    <button class="filter-apply" part="apply">Apply</button>
                    <button class="filter-reset" part="reset">Reset</button>
                </div>
            </div>
        `;
    }
    
    protected getStyles(): string {
        return `
            .filter-container {
                display: flex;
                gap: 1rem;
                padding: 1rem;
                background: var(--aits-bg-muted, #f9fafb);
                border-radius: var(--aits-radius-md, 0.375rem);
            }
            
            .layout-horizontal {
                flex-direction: row;
                align-items: center;
            }
            
            .layout-vertical {
                flex-direction: column;
            }
            
            .filter-actions {
                display: flex;
                gap: 0.5rem;
                margin-left: auto;
            }
            
            .filter-apply,
            .filter-reset {
                padding: 0.5rem 1rem;
                border: 1px solid var(--aits-border-color, #e5e7eb);
                border-radius: var(--aits-radius-md, 0.375rem);
                background: white;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .filter-apply {
                background: var(--aits-color-primary, #3b82f6);
                color: white;
                border-color: var(--aits-color-primary, #3b82f6);
            }
            
            .filter-apply:hover {
                background: var(--aits-color-primary-dark, #2563eb);
            }
            
            .filter-reset:hover {
                background: var(--aits-bg-hover, #f3f4f6);
            }
        `;
    }
    
    protected afterRender(): void {
        const applyBtn = this.$('.filter-apply') as HTMLButtonElement;
        const resetBtn = this.$('.filter-reset') as HTMLButtonElement;
        
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
        
        // 필터 입력 요소들 모니터링
        this.monitorFilterInputs();
    }
    
    private monitorFilterInputs(): void {
        const inputs = this.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const name = (input as HTMLInputElement).name;
                const value = (input as HTMLInputElement).value;
                
                if (value) {
                    this.filters[name] = value;
                } else {
                    delete this.filters[name];
                }
            });
        });
    }
    
    private applyFilters(): void {
        this.emit('filter', { filters: this.filters });
    }
    
    private resetFilters(): void {
        this.filters = {};
        
        // 입력 요소들 초기화
        this.querySelectorAll('input, select').forEach(input => {
            if (input instanceof HTMLInputElement) {
                input.value = '';
            } else if (input instanceof HTMLSelectElement) {
                input.selectedIndex = 0;
            }
        });
        
        this.emit('reset');
        this.emit('filter', { filters: {} });
    }
}