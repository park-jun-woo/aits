import { AitsElement } from './AitsElement';
/**
 * <ai-more>: '더보기' 기능을 위한 컴포넌트.
 */
class AitsMore extends AitsElement {
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('click', () => {
            this.dispatchEventToController('aits-more', {});
        });
    }

    protected render() {
        this.shadow.innerHTML = `<button><slot>More</slot></button>`;
    }
}
customElements.define('ai-more', AitsMore);