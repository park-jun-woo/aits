import { AitsElement } from './AitsElement';

/**
 * AitsProgress - 진행 상태 표시 컴포넌트
 * <div is="aits-progress">
 */
export class AitsProgress extends AitsElement {
    static get observedAttributes() {
        return ['value', 'max', 'variant', 'show-label', 'indeterminate'];
    }
    
    protected getTemplate(): string {
        const value = this.getNumberAttr('value', 0);
        const max = this.getNumberAttr('max', 100);
        const percentage = Math.min(100, (value / max) * 100);
        const showLabel = this.getBoolAttr('show-label');
        const indeterminate = this.getBoolAttr('indeterminate');
        
        return `
            <div class="progress-container ${indeterminate ? 'indeterminate' : ''}" part="container">
                <div class="progress-bar" part="bar" style="width: ${indeterminate ? '100%' : percentage + '%'}"></div>
            </div>
            ${showLabel && !indeterminate ? `
                <div class="progress-label" part="label">
                    ${Math.round(percentage)}%
                </div>
            ` : ''}
        `;
    }
    
    protected getStyles(): string {
        const variant = this.getAttr('variant', 'primary');
        const colors: Record<string, string> = {
            primary: 'var(--aits-color-primary, #3b82f6)',
            success: 'var(--aits-color-success, #10b981)',
            warning: 'var(--aits-color-warning, #f59e0b)',
            danger: 'var(--aits-color-danger, #ef4444)'
        };
        
        return `
            :host {
                display: block;
            }
            
            .progress-container {
                width: 100%;
                height: 8px;
                background: var(--aits-bg-muted, #e5e7eb);
                border-radius: var(--aits-radius-full, 9999px);
                overflow: hidden;
                position: relative;
            }
            
            .progress-bar {
                height: 100%;
                background: ${colors[variant] || colors.primary};
                transition: width 0.3s ease;
                border-radius: var(--aits-radius-full, 9999px);
            }
            
            .indeterminate .progress-bar {
                animation: indeterminate 1.5s linear infinite;
                background: linear-gradient(
                    90deg,
                    transparent,
                    ${colors[variant] || colors.primary},
                    transparent
                );
            }
            
            @keyframes indeterminate {
                0% {
                    transform: translateX(-100%);
                }
                100% {
                    transform: translateX(100%);
                }
            }
            
            .progress-label {
                text-align: center;
                margin-top: 0.5rem;
                font-size: 0.875rem;
                color: var(--aits-text-secondary, #6b7280);
            }
        `;
    }
    
    public setValue(value: number): void {
        this.setAttribute('value', String(value));
        this.render();
    }
    
    public setProgress(percentage: number): void {
        const max = this.getNumberAttr('max', 100);
        const value = (percentage / 100) * max;
        this.setValue(value);
    }
}