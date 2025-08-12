import { AitsElement } from './AitsElement';

/**
 * AitsFooter - 푸터 영역
 * <footer is="aits-footer">
 */
export class AitsFooter extends AitsElement {
    static get observedAttributes() {
        return ['variant', 'fixed'];
    }
    
    protected getTemplate(): string {
        const variant = this.getAttr('variant', 'default');
        
        return `
            <div class="footer-container variant-${variant}" part="container">
                <div class="footer-content" part="content">
                    <slot name="main"></slot>
                </div>
                
                <div class="footer-links" part="links">
                    <slot name="links"></slot>
                </div>
                
                <div class="footer-bottom" part="bottom">
                    <slot name="copyright"></slot>
                    <slot name="social"></slot>
                </div>
            </div>
        `;
    }
    
    protected getStyles(): string {
        const isFixed = this.getBoolAttr('fixed');
        
        return `
            :host {
                display: block;
                ${isFixed ? `
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 100;
                ` : ''}
                background: var(--aits-footer-bg, #111827);
                color: var(--aits-footer-color, white);
                margin-top: auto;
            }
            
            .footer-container {
                max-width: var(--aits-max-width, 1200px);
                margin: 0 auto;
                padding: 3rem 2rem 1.5rem;
            }
            
            .variant-minimal {
                padding: 1.5rem 2rem;
            }
            
            .footer-content {
                margin-bottom: 2rem;
            }
            
            .footer-links {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 2rem;
                margin-bottom: 2rem;
            }
            
            .footer-bottom {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 2rem;
                border-top: 1px solid rgba(255,255,255,0.1);
            }
            
            @media (max-width: 768px) {
                .footer-bottom {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }
            }
        `;
    }
}