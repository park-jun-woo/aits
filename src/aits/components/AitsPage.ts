import { AitsElement } from './AitsElement';
/**
 * <ai-page>: 라우팅의 단위가 되는 최상위 컨테이너.
 * 내부에 슬롯을 두어 자식 요소들을 그대로 표시합니다.
 */
class AitsPage extends AitsElement {
    constructor() {
        super();
    }

    protected render() {
        this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 1rem;
                }
            </style>
            <slot></slot> 
        `;
    }
}
customElements.define('ai-page', AitsPage);