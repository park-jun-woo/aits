import { AitsElement } from './AitsElement';
/**
 * <button is="aits-more">: '더보기' 기능을 위한 컴포넌트.
 */
class AitsMore extends AitsElement {
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('click', () => {
            this.dispatchEventToController('aits-more', {});
        });
    }

    protected render() {
        this.shadow.innerHTML = `<slot>More</slot>`;
    }
}
customElements.define('aits-more', AitsMore, { extends: 'button' });