import { AitsElement } from './AitsElement';

/**
 * AitsInput - 입력 필드 컴포넌트
 * <input is="aits-input">
 */
export class AitsInput extends AitsElement {
    protected useShadowDOM = false; // Input은 Light DOM 사용
    
    static get observedAttributes() {
        return ['type', 'label', 'helper', 'error', 'required'];
    }
    
    protected initialize(): void {
        this.enhanceInput();
    }
    
    private enhanceInput(): void {
        // 래퍼 생성
        const wrapper = document.createElement('div');
        wrapper.className = 'aits-input-wrapper';
        
        // 라벨 추가
        const label = this.getAttr('label');
        if (label) {
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.className = 'aits-input-label';
            if (this.getBoolAttr('required')) {
                labelEl.innerHTML += ' <span class="required">*</span>';
            }
            wrapper.appendChild(labelEl);
        }
        
        // input 요소 이동
        const input = this.querySelector('input') || this.createInput();
        wrapper.appendChild(input);
        
        // 헬퍼 텍스트
        const helper = this.getAttr('helper');
        if (helper) {
            const helperEl = document.createElement('span');
            helperEl.textContent = helper;
            helperEl.className = 'aits-input-helper';
            wrapper.appendChild(helperEl);
        }
        
        // 에러 메시지 컨테이너
        const errorContainer = document.createElement('span');
        errorContainer.className = 'aits-input-error';
        wrapper.appendChild(errorContainer);
        
        this.appendChild(wrapper);
        
        // 이벤트 처리
        input.addEventListener('input', () => {
            this.value = input.value;
        });
        
        input.addEventListener('change', () => {
            this.emit('change', { value: input.value });
        });
        
        input.addEventListener('blur', () => {
            this.emit('blur', { value: input.value });
        });
    }
    
    private createInput(): HTMLInputElement {
        const input = document.createElement('input');
        input.type = this.getAttr('type', 'text');
        input.placeholder = this.getAttr('placeholder', '');
        input.required = this.getBoolAttr('required');
        input.disabled = this.getBoolAttr('disabled');
        input.readOnly = this.getBoolAttr('readonly');
        
        return input;
    }
    
    public setError(error: string | null): void {
        const errorEl = this.querySelector('.aits-input-error');
        if (errorEl) {
            errorEl.textContent = error || '';
        }
        
        const input = this.querySelector('input');
        if (input) {
            input.classList.toggle('error', !!error);
        }
    }
    
    protected getTemplate(): string {
        // Light DOM이므로 템플릿 불필요
        return '';
    }
}