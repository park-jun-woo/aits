// /src/components/AitsList.ts
import { AitsElement } from './AitsElement';

class AitsList extends AitsElement {
    private _items: any[] = [];
    private itemTemplate: HTMLTemplateElement | null = null;
    private containerElement: HTMLElement | null = null;

    set items(value: any[]) {
        this._items = value;
        this.renderItems();
    }

    get items(): any[] {
        return this._items;
    }

    connectedCallback() {
        // 1. data-list-body 속성을 가진 자식 요소를 컨테이너로 찾습니다.
        this.containerElement = this.querySelector('[data-list-body]');

        if (!this.containerElement) {
            console.error('[Aits] <aits-list> must contain a child element with the [data-list-body] attribute.');
            return;
        }

        // 2. "더보기"와 같은 클라이언트 측 렌더링을 위해 <template>을 찾습니다.
        this.itemTemplate = this.containerElement.querySelector('template');
        if (!this.itemTemplate) {
            console.warn('[Aits] <template> tag not found in [data-list-body]. Client-side rendering will not be possible.');
        }

        // 3. 컴포넌트의 뼈대(Shadow DOM)를 렌더링합니다.
        //    이 단계에서는 서버에서 렌더링된 자식(Light DOM)을 건드리지 않습니다.
        super.connectedCallback();
    }

    protected render() {
        // Shadow DOM은 슬롯만 제공하여 내부 구조(ul, table 등)를 그대로 노출시킵니다.
        this.shadow.innerHTML = `<slot></slot>`;
    }

    /**
     * 클라이언트 측에서 .items 속성을 통해 데이터가 주입되었을 때만 호출됩니다.
     * 이 메소드는 컨테이너 내부를 완전히 제어합니다.
     */
    protected renderItems() {
        if (!this.containerElement || !this.itemTemplate) return;

        // 기존 아이템들(서버에서 렌더링 된 것도 포함)을 모두 삭제합니다.
        Array.from(this.containerElement.children).forEach(child => {
            if (child.tagName !== 'TEMPLATE') child.remove();
        });

        const fragment = document.createDocumentFragment();
        this._items.forEach(item => {
            const itemHtml = this.simpleTemplate(this.itemTemplate!.innerHTML, item);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = itemHtml;
            while(tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
        });
        this.containerElement.appendChild(fragment);
    }
}

customElements.define('aits-list', AitsList);