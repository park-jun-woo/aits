import { AitsElement } from './AitsElement';

/**
 * AitsMore - 더보기 버튼 컴포넌트
 * <button is="aits-more">
 */
export class AitsMore extends AitsElement {
    private loading: boolean = false;
    
    static get observedAttributes() {
        return ['loading', 'disabled'];
    }
    
    protected getTemplate(): string {
        return `
            <button class="more-button" part="button" ?disabled="${this.loading || this.state.disabled}">
                ${this.loading ? `
                    <span class="spinner"></span>
                    <span>Loading...</span>
                ` : `
                    <slot>Load More</slot>
                `}
            </button>
        `;
    }
    
    protected getStyles(): string {
        return `
            .more-button {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                width: 100%;
                padding: 0.75rem 1.5rem;
                border: 1px solid var(--aits-border-color, #e5e7eb);
                background: white;
                border-radius: var(--aits-radius-md, 0.375rem);
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s ease;
            }
            
            .more-button:hover:not(:disabled) {
                background: var(--aits-bg-hover, #f9fafb);
            }
            
            .more-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
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
        const button = this.$('.more-button') as HTMLButtonElement;
        
        if (button) {
            button.addEventListener('click', async () => {
                if (this.loading || this.state.disabled) return;
                
                this.loading = true;
                this.render();
                
                // 이벤트 발생
                const event = this.emit('load-more', {}, { cancelable: true });
                
                // 외부에서 처리 완료 시그널을 기다림
                // 실제 사용 시 컨트롤러에서 this.setLoading(false) 호출
            });
        }
    }
    
    public setLoading(loading: boolean): void {
        this.loading = loading;
        this.render();
    }
}