import { AitsElement } from './AitsElement';
/**
 * <nav is="aits-nav">: 내비게이션 메뉴를 감싸는 컨테이너.
 */
export class AitsNav extends AitsElement {
    constructor() {
        super();
    }
    protected render() {
        this.shadow.innerHTML = `
            <style>
                :host { display: flex; align-items: center; gap: 1rem; }
            </style>
            <slot></slot>
        `;
    }
}