import { AitsElement } from './AitsElement';
/**
 * <form is="aits-form">: 데이터 제출을 위한 폼 컨테이너.
 */
class AitsForm extends AitsElement {
    connectedCallback() {
        super.connectedCallback();
        this.shadow.addEventListener('submit', (e) => {
            e.preventDefault(); // 기본 폼 제출 동작 방지
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Controller가 처리할 수 있도록 'aits-submit' 이벤트를 발생시킴
            this.dispatchEventToController('aits-submit', {
                action: form.action,
                method: form.method,
                data: data
            });
        });
    }

    protected render() {
        // form 태그는 Light DOM에 있어야 하므로, slot을 사용
        this.shadow.innerHTML = `<slot></slot>`;
        // 실제 form 태그는 사용자가 HTML에 직접 작성
        const formElement = document.createElement('form');
        formElement.action = this.getAttribute('action') || '';
        formElement.method = this.getAttribute('method') || 'POST';
        
        // 자식 요소들을 실제 form 안으로 이동
        while(this.firstChild) {
            formElement.appendChild(this.firstChild);
        }
        this.appendChild(formElement);
    }
}
customElements.define('aits-form', AitsForm, { extends: 'form' });