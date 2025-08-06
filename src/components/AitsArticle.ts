import { AitsElement } from './AitsElement';
/**
 * <ai-article>: 단일 데이터(게시물 등)를 표시하는 컴포넌트.
 * Controller가 직접 data 프로퍼티를 통해 데이터를 주입합니다.
 */
class AitsArticle extends AitsElement {
    private _data: object | null = null;
    
    set data(value: object | null) {
        this._data = value;
        this.render();
    }

    get data(): object | null {
        return this._data;
    }

    protected render() {
        if (!this._data) {
            this.shadow.innerHTML = `<slot name="loading">Loading article...</slot>`;
            return;
        }
        
        // 자식 노드(템플릿)를 데이터와 바인딩하여 렌더링
        const template = this.innerHTML;
        this.shadow.innerHTML = this.simpleTemplate(template, this._data);
    }
}
customElements.define('ai-article', AitsArticle);