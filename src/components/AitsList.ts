import { AitsElement } from './AitsElement';
/**
 * <ai-list>: 목록 데이터를 렌더링하는 핵심 컴포넌트.
 */
class AitsList extends AitsElement {
    private _items: any[] = [];
    private itemTemplate: HTMLTemplateElement | null = null;

    set items(value: any[]) {
        this._items = value;
        this.render();
    }

    get items(): any[] {
        return this._items;
    }

    connectedCallback() {
        // 자식 요소 중 <template>을 찾아 아이템 템플릿으로 저장
        this.itemTemplate = this.querySelector('template');
        super.connectedCallback();
    }

    protected render() {
        if (!this.itemTemplate) {
            this.shadow.innerHTML = "Error: <template> for list items not found.";
            return;
        }

        let listHtml = '';
        if (this._items.length > 0) {
            listHtml = this._items.map(item => 
                this.simpleTemplate(this.itemTemplate!.innerHTML, item)
            ).join('');
        } else {
            listHtml = `<slot name="empty">No items found.</slot>`;
        }
        
        this.shadow.innerHTML = `
            <style>
                :host { display: block; }
                .list-container { display: flex; flex-direction: column; gap: 1rem; }
            </style>
            <div class="list-container">
                ${listHtml}
            </div>
            <slot></slot> <!-- for ai-more, ai-search etc. -->
        `;
    }
}
customElements.define('ai-list', AitsList);