import { AitsElement } from './AitsElement';

/**
 * AitsSidebar - 사이드바 영역
 * <aside is="aits-sidebar">
 */
export class AitsSidebar extends AitsElement {
    static get observedAttributes() {
        return ['position', 'collapsible', 'collapsed'];
    }
    
    private _collapsed: boolean = false;
    
    protected initialize(): void {
        this._collapsed = this.getBoolAttr('collapsed');
    }
    
    protected getTemplate(): string {
        const position = this.getAttr('position', 'left');
        const isCollapsible = this.getBoolAttr('collapsible');
        
        return `
            <div class="sidebar-container position-${position} ${this._collapsed ? 'collapsed' : ''}" 
                 part="container">
                ${isCollapsible ? `
                    <button class="sidebar-toggle" part="toggle" aria-label="Toggle sidebar">
                        <span class="toggle-icon">☰</span>
                    </button>
                ` : ''}
                
                <div class="sidebar-content" part="content">
                    <slot name="header"></slot>
                    <slot></slot>
                    <slot name="footer"></slot>
                </div>
            </div>
        `;
    }
    
    protected getStyles(): string {
        return `
            :host {
                display: block;
                height: 100%;
            }
            
            .sidebar-container {
                height: 100%;
                width: var(--aits-sidebar-width, 250px);
                background: var(--aits-sidebar-bg, white);
                border-right: 1px solid var(--aits-border-color, #e5e7eb);
                transition: all 0.3s ease;
                position: relative;
            }
            
            .position-right {
                border-right: none;
                border-left: 1px solid var(--aits-border-color, #e5e7eb);
            }
            
            .sidebar-container.collapsed {
                width: var(--aits-sidebar-collapsed-width, 60px);
            }
            
            .sidebar-toggle {
                position: absolute;
                top: 1rem;
                right: -12px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--aits-sidebar-bg, white);
                border: 1px solid var(--aits-border-color, #e5e7eb);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
                transition: all 0.2s ease;
            }
            
            .sidebar-toggle:hover {
                background: var(--aits-bg-hover, #f9fafb);
            }
            
            .position-right .sidebar-toggle {
                left: -12px;
                right: auto;
            }
            
            .sidebar-content {
                padding: 1rem;
                height: 100%;
                overflow-y: auto;
            }
            
            .collapsed .sidebar-content {
                padding: 0.5rem;
            }
            
            .collapsed ::slotted(*) {
                text-align: center;
            }
            
            @media (max-width: 768px) {
                .sidebar-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    z-index: 999;
                    transform: translateX(-100%);
                }
                
                .sidebar-container:not(.collapsed) {
                    transform: translateX(0);
                }
                
                .position-right {
                    left: auto;
                    right: 0;
                    transform: translateX(100%);
                }
                
                .position-right:not(.collapsed) {
                    transform: translateX(0);
                }
            }
        `;
    }
    
    protected afterRender(): void {
        const toggle = this.$('.sidebar-toggle') as HTMLButtonElement;
        if (toggle) {
            toggle.addEventListener('click', () => {
                this._collapsed = !this._collapsed;
                this.toggleAttribute('collapsed', this._collapsed);
                this.render();
                this.emit('toggle', { collapsed: this._collapsed });
            });
        }
    }
    
    public toggle(): void {
        this._collapsed = !this._collapsed;
        this.toggleAttribute('collapsed', this._collapsed);
        this.render();
    }
    
    public collapse(): void {
        this._collapsed = true;
        this.setAttribute('collapsed', '');
        this.render();
    }
    
    public expand(): void {
        this._collapsed = false;
        this.removeAttribute('collapsed');
        this.render();
    }
}