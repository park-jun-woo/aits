import { AitsElement } from './AitsElement';
/**
 * <ai-search>: 검색 입력을 위한 컴포넌트.
 */
class AitsSearch extends AitsElement {
    connectedCallback() {
        super.connectedCallback();
        this.shadow.querySelector('button')?.addEventListener('click', () => {
            const input = this.shadow.querySelector('input');
            if (input) {
                this.dispatchEventToController('aits-search', { query: input.value });
            }
        });
    }

    protected render() {
        this.shadow.innerHTML = `
            <input type="search" placeholder="${this.getAttribute('placeholder') || 'Search...'}">
            <button>Search</button>
        `;
    }
}
customElements.define('ai-search', AitsSearch);