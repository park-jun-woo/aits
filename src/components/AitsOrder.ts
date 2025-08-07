import { AitsElement } from './AitsElement';
/**
 * <aits-order>: 목록 정렬을 위한 컴포넌트.
 */
class AitsOrder extends AitsElement {
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('click', () => {
            const sortKey = this.getAttribute('sort-key');
            if (sortKey) {
                this.dispatchEventToController('aits-order', { key: sortKey });
            }
        });
    }

    protected render() {
        // 스타일링을 위해 버튼으로 감쌀 수 있음
        this.shadow.innerHTML = `<slot></slot>`;
    }
}
customElements.define('aits-order', AitsOrder);