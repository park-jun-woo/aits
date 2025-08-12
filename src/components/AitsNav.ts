import { AitsElement } from './AitsElement';

/**
 * AitsNav - 네비게이션 영역
 * <nav is="aits-nav">
 */
export class AitsNav extends AitsElement {
    static get observedAttributes() {
        return ['orientation', 'variant'];
    }
    
    protected getTemplate(): string {
        const orientation = this.getAttr('orientation', 'horizontal');
        const variant = this.getAttr('variant', 'default');
        
        return `
            <ul class="nav-list orientation-${orientation} variant-${variant}" part="list">
                <slot></slot>
            </ul>
        `;
    }
    
    protected getStyles(): string {
        return `
            :host {
                display: block;
            }
            
            .nav-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                gap: 0.5rem;
            }
            
            .orientation-horizontal {
                flex-direction: row;
                align-items: center;
            }
            
            .orientation-vertical {
                flex-direction: column;
            }
            
            .variant-pills ::slotted(a) {
                padding: 0.5rem 1rem;
                border-radius: var(--aits-radius-full, 9999px);
                transition: all 0.2s ease;
            }
            
            .variant-pills ::slotted(a:hover),
            .variant-pills ::slotted(a[aria-current="page"]) {
                background: var(--aits-color-primary, #3b82f6);
                color: white;
            }
            
            .variant-underline ::slotted(a) {
                padding: 0.5rem 0;
                border-bottom: 2px solid transparent;
                transition: all 0.2s ease;
            }
            
            .variant-underline ::slotted(a:hover),
            .variant-underline ::slotted(a[aria-current="page"]) {
                border-bottom-color: var(--aits-color-primary, #3b82f6);
            }
            
            ::slotted(a) {
                text-decoration: none;
                color: inherit;
                display: block;
                padding: 0.5rem 1rem;
                transition: all 0.2s ease;
            }
            
            ::slotted(a:hover) {
                color: var(--aits-color-primary, #3b82f6);
            }
        `;
    }
}