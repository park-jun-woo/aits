import { AitsElement } from './AitsElement';

/**
 * AitsForm - 폼 컴포넌트
 * <form is="aits-form">
 */
export class AitsForm extends AitsElement {
    protected useShadowDOM = false; // 폼은 Light DOM 사용
    
    static get observedAttributes() {
        return ['variant', 'layout', 'validation'];
    }
    
    private formElement: HTMLFormElement | null = null;
    
    protected initialize(): void {
        // 기존 form 요소를 찾거나 생성
        this.formElement = this.querySelector('form') || this.createFormElement();
        this.enhanceForm();
    }
    
    private createFormElement(): HTMLFormElement {
        const form = document.createElement('form');
        form.method = this.getAttr('method', 'POST');
        form.action = this.getAttr('action', '#');
        
        // 기존 자식 요소들을 form으로 이동
        while (this.firstChild) {
            form.appendChild(this.firstChild);
        }
        
        this.appendChild(form);
        return form;
    }
    
    private enhanceForm(): void {
        if (!this.formElement) return;
        
        // 폼 제출 처리
        this.formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (this.getBoolAttr('validation') && !this.validate()) {
                return;
            }
            
            const formData = new FormData(this.formElement!);
            const data = Object.fromEntries(formData.entries());
            
            this.emit('submit', {
                data,
                formData,
                action: this.formElement!.action,
                method: this.formElement!.method
            });
        });
        
        // 입력 필드 향상
        this.enhanceInputs();
    }
    
    private enhanceInputs(): void {
        const inputs = this.formElement!.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // 실시간 유효성 검사
            if (this.getBoolAttr('validation')) {
                input.addEventListener('blur', () => {
                    this.validateField(input as HTMLInputElement);
                });
            }
            
            // 변경 이벤트 전파
            input.addEventListener('change', () => {
                this.emit('field-change', {
                    field: (input as HTMLInputElement).name,
                    value: (input as HTMLInputElement).value
                });
            });
        });
    }
    
    private validate(): boolean {
        const inputs = this.formElement!.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input as HTMLInputElement)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    private validateField(field: HTMLInputElement): boolean {
        const value = field.value;
        const required = field.hasAttribute('required');
        const pattern = field.getAttribute('pattern');
        const type = field.type;
        
        // 에러 메시지 제거
        const existingError = field.parentElement?.querySelector('.field-error');
        existingError?.remove();
        
        // 필수 필드 검사
        if (required && !value.trim()) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // 패턴 검사
        if (pattern && value) {
            const regex = new RegExp(pattern);
            if (!regex.test(value)) {
                this.showFieldError(field, 'Invalid format');
                return false;
            }
        }
        
        // 이메일 검사
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Invalid email address');
                return false;
            }
        }
        
        return true;
    }
    
    private showFieldError(field: HTMLInputElement, message: string): void {
        const error = document.createElement('span');
        error.className = 'field-error';
        error.textContent = message;
        error.style.cssText = 'color: red; font-size: 0.875rem; margin-top: 0.25rem; display: block;';
        
        field.parentElement?.appendChild(error);
        field.classList.add('error');
    }
    
    public reset(): void {
        this.formElement?.reset();
        this.querySelectorAll('.field-error').forEach(el => el.remove());
        this.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    }
    
    public getFormData(): FormData | null {
        return this.formElement ? new FormData(this.formElement) : null;
    }
    
    public setFieldValue(name: string, value: any): void {
        const field = this.formElement?.elements.namedItem(name) as HTMLInputElement;
        if (field) {
            field.value = value;
        }
    }
    
    protected getTemplate(): string {
        // Light DOM이므로 템플릿 불필요
        return '';
    }
}