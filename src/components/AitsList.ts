import { AitsElement } from './AitsElement';

export class AitsList extends AitsElement {
    private _items: any[] = [];
    private itemTemplate: HTMLTemplateElement | null = null;
    private containerElement: HTMLElement | null = null;
    private containerTemplate: string = ''; // 목록 컨테이너의 템플릿

    // 'items'는 목록 데이터 전용으로 계속 사용
    set items(value: any[]) {
        this._items = value;
        if (this.containerElement) { // 컨테이너가 준비되었을 때만 렌더링
            this.renderItems();
        }
    }

    get items(): any[] {
        return this._items;
    }

    connectedCallback() {
        // 부모의 data/render 로직과 충돌하지 않도록 connectedCallback을 오버라이드
        this.containerElement = this.querySelector('[data-list-body]');
        if (!this.containerElement) {
            console.error('[Aits] <aits-list> must contain a child with [data-list-body].');
            return;
        }

        // 아이템 템플릿과 컨테이너 템플릿을 저장
        this.itemTemplate = this.containerElement.querySelector('template');
        this.containerTemplate = this.containerElement.innerHTML;
        
        // 초기 렌더링
        this.render(); 
    }
    
    // 부모의 render를 오버라이드하여 컴포넌트의 전체 구조(chrome)를 렌더링
    protected render() {
        if (!this.containerElement || !this.data) return;

        // 1. data 속성을 사용해 컨테이너의 머리글/바닥글을 먼저 렌더링
        //    개선된 simpleTemplate 덕분에 <template> 태그 안의 ${...}는 안전하게 보존됨
        this.containerElement.innerHTML = this.simpleTemplate(this.containerTemplate, this.data);
        
        // 2. 이전에 설정된 items가 있다면 아이템 목록도 다시 렌더링
        if (this._items.length > 0) {
            this.renderItems();
        }
    }

    // 아이템 목록만 렌더링하는 전문화된 메소드
    protected renderItems() {
        if (!this.containerElement || !this.itemTemplate) return;

        // 기존 아이템들(서버에서 렌더링 된 것도 포함)을 모두 삭제합니다.
        // 이때 <template> 태그는 삭제하지 않도록 주의해야 합니다.
        Array.from(this.containerElement.children).forEach(child => {
            if (child.tagName !== 'TEMPLATE' && !child.hasAttribute('data-list-header') && !child.hasAttribute('data-list-footer')) {
                 child.remove();
            }
        });
        
        const fragment = document.createDocumentFragment();
        this._items.forEach(item => {
            // 아이템 렌더링 시에는 <template> 안의 HTML만 사용
            const itemHtml = this.simpleTemplate(this.itemTemplate!.innerHTML, item);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = itemHtml;
            while(tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
        });

        // 템플릿 태그를 기준으로 아이템들을 삽입
        this.containerElement.insertBefore(fragment, this.itemTemplate);
    }
}