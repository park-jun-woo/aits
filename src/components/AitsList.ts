import { AitsElement } from './AitsElement';

/**
 * AitsList - 목록 데이터를 표시하는 컴포넌트
 * <ul is="aits-list"> 또는 <ol is="aits-list">
 */
export class AitsList extends AitsElement {
    static get observedAttributes() {
        return ['variant', 'spacing', 'divider', 'numbered'];
    }
    
    protected getTemplate(): string {
        const spacing = this.getAttr('spacing', 'medium');
        const hasDivider = this.getBoolAttr('divider');
        
        if (!this.items || this.items.length === 0) {
            return this.getEmptyTemplate();
        }
        
        return `
            <slot name="header"></slot>
            <div class="list-container" part="container">
                ${this.items.map((item, index) => `
                    <div class="list-item ${hasDivider && index > 0 ? 'has-divider' : ''}" 
                         part="item" 
                         data-index="${index}">
                        <slot name="item-${index}">
                            ${this.renderItem(item, index)}
                        </slot>
                    </div>
                `).join('')}
            </div>
            <slot name="footer"></slot>
        `;
    }
    
    protected renderItem(item: any, index: number): string {
        // 기본 아이템 렌더링
        if (typeof item === 'string') {
            return `<span class="item-text">${this.escapeHtml(item)}</span>`;
        }
        
        // 객체인 경우
        return `
            <div class="item-content">
                ${item.title ? `<div class="item-title">${this.escapeHtml(item.title)}</div>` : ''}
                ${item.description ? `<div class="item-description">${this.escapeHtml(item.description)}</div>` : ''}
                ${item.meta ? `<div class="item-meta">${this.escapeHtml(item.meta)}</div>` : ''}
            </div>
        `;
    }
    
    protected getStyles(): string {
        return `
            .list-container {
                display: flex;
                flex-direction: column;
                gap: var(--aits-spacing-${this.getAttr('spacing', 'medium')}, 1rem);
            }
            
            .list-item {
                position: relative;
                transition: all 0.2s ease;
            }
            
            .list-item.has-divider::before {
                content: '';
                position: absolute;
                top: calc(var(--aits-spacing-sm, 0.5rem) * -1);
                left: 0;
                right: 0;
                height: 1px;
                background: var(--aits-border-color, #e5e7eb);
            }
            
            .list-item:hover {
                background: var(--aits-hover-bg, rgba(0,0,0,0.02));
            }
            
            .item-content {
                padding: var(--aits-spacing-sm, 0.5rem);
            }
            
            .item-title {
                font-weight: 600;
                color: var(--aits-text-primary, #111827);
                margin-bottom: 0.25rem;
            }
            
            .item-description {
                color: var(--aits-text-secondary, #6b7280);
                font-size: 0.875rem;
            }
            
            .item-meta {
                color: var(--aits-text-muted, #9ca3af);
                font-size: 0.75rem;
                margin-top: 0.25rem;
            }
        `;
    }
    
    // 아이템 추가/제거 메서드
    public addItem(item: any, index?: number): void {
        if (index !== undefined) {
            this.items.splice(index, 0, item);
        } else {
            this.items.push(item);
        }
        this.render();
        this.emit('item-added', { item, index });
    }
    
    public removeItem(index: number): void {
        const removed = this.items.splice(index, 1)[0];
        this.render();
        this.emit('item-removed', { item: removed, index });
    }
    
    public updateItem(index: number, item: any): void {
        const oldItem = this.items[index];
        this.items[index] = item;
        this.render();
        this.emit('item-updated', { oldItem, newItem: item, index });
    }
}