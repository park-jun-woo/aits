import { AitsElement } from './AitsElement';

/**
 * AitsHeader - 헤더 영역
 * <header is="aits-header">
 */
export class AitsHeader extends AitsElement {
    static get observedAttributes() {
        return ['fixed', 'transparent', 'shadow'];
    }
    
    protected getTemplate(): string {
        return `
            <div class="header-container" part="container">
                <div class="header-brand" part="brand">
                    <slot name="logo"></slot>
                    <slot name="title"></slot>
                </div>
                
                <nav class="header-nav" part="nav">
                    <slot name="nav"></slot>
                </nav>
                
                <div class="header-actions" part="actions">
                    <slot name="actions"></slot>
                </div>
                
                <button class="header-toggle" part="toggle" aria-label="Menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        `;
    }
    
    protected getStyles(): string {
        const isFixed = this.getBoolAttr('fixed');
        const isTransparent = this.getBoolAttr('transparent');
        const hasShadow = this.getBoolAttr('shadow');
        
        return `
            :host {
                display: block;
                ${isFixed ? `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                ` : ''}
                background: ${isTransparent ? 'transparent' : 'var(--aits-header-bg, white)'};
                ${hasShadow ? 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);' : ''}
                border-bottom: 1px solid var(--aits-border-color, #e5e7eb);
            }
            
            .header-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem 2rem;
                max-width: var(--aits-max-width, 1200px);
                margin: 0 auto;
            }
            
            .header-brand {
                display: flex;
                align-items: center;
                gap: 1rem;
                font-size: 1.25rem;
                font-weight: 600;
            }
            
            .header-nav {
                flex: 1;
                display: flex;
                justify-content: center;
                gap: 2rem;
            }
            
            .header-actions {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .header-toggle {
                display: none;
                flex-direction: column;
                justify-content: space-between;
                width: 24px;
                height: 18px;
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 0;
            }
            
            .header-toggle span {
                display: block;
                width: 100%;
                height: 2px;
                background: currentColor;
                transition: all 0.3s ease;
            }
            
            @media (max-width: 768px) {
                .header-nav,
                .header-actions {
                    display: none;
                }
                
                .header-toggle {
                    display: flex;
                }
                
                :host([menu-open]) .header-nav,
                :host([menu-open]) .header-actions {
                    display: flex;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    flex-direction: column;
                    background: var(--aits-header-bg, white);
                    padding: 1rem 2rem;
                    border-bottom: 1px solid var(--aits-border-color, #e5e7eb);
                }
            }
        `;
    }
    
    protected afterRender(): void {
        const toggle = this.$('.header-toggle') as HTMLButtonElement;
        if (toggle) {
            toggle.addEventListener('click', () => {
                this.toggleAttribute('menu-open');
                this.emit('menu-toggle', { 
                    open: this.hasAttribute('menu-open') 
                });
            });
        }
    }
}