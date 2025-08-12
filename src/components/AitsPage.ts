import { AitsElement } from './AitsElement';
/**
 * AitsPage - 메인 콘텐츠 영역
 * <main is="aits-page">
 */
export class AitsPage extends AitsElement {
    static get observedAttributes() {
        return ['layout', 'padding', 'max-width'];
    }
    
    protected getTemplate(): string {
        const layout = this.getAttr('layout', 'default');
        const maxWidth = this.getAttr('max-width', 'container');
        
        return `
            <div class="page-container layout-${layout} max-width-${maxWidth}" part="container">
                <slot name="hero"></slot>
                <div class="page-content" part="content">
                    <slot></slot>
                </div>
                <slot name="aside"></slot>
            </div>
        `;
    }
    
    protected getStyles(): string {
        const padding = this.getAttr('padding', 'normal');
        const paddingValues: Record<string, string> = {
            none: '0',
            small: '1rem',
            normal: '2rem',
            large: '3rem'
        };
        
        return `
            :host {
                display: block;
                min-height: 100vh;
                padding-top: var(--aits-header-height, 0);
                padding-bottom: var(--aits-footer-height, 0);
            }
            
            .page-container {
                width: 100%;
                margin: 0 auto;
                padding: ${paddingValues[padding] || paddingValues.normal};
            }
            
            .max-width-container {
                max-width: var(--aits-max-width, 1200px);
            }
            
            .max-width-wide {
                max-width: var(--aits-max-width-wide, 1440px);
            }
            
            .max-width-full {
                max-width: 100%;
            }
            
            .layout-default {
                display: block;
            }
            
            .layout-sidebar {
                display: grid;
                grid-template-columns: 1fr 300px;
                gap: 2rem;
            }
            
            .layout-split {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
            }
            
            @media (max-width: 768px) {
                .layout-sidebar,
                .layout-split {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }
}