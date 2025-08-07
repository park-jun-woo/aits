// /aits/src/components/AitsHeader.ts

import { AitsElement } from './AitsElement';

/**
 * <header is="aits-header">: 페이지의 헤더 영역을 정의하는 컨테이너 컴포넌트.
 * 내부에 슬롯을 두어 자식 요소들을 그대로 표시합니다.
 */
class AitsHeader extends AitsElement {
    constructor() {
        super();
    }

    protected render() {
        this.shadow.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    width: 100%;
                    top: 0;
                    left: 0;
                    box-sizing: border-box; /* padding이 너비에 포함되도록 설정 */

                    display: flex;
                    align-items: center;
                    padding: 10px 20px;
                    background-color: var(--surface-color, #ffffff);
                    border-bottom: 1px solid var(--border-color, #e5e7eb);
                    z-index: 1000;
                    user-select: none;
                }
                
                ::slotted(a) {
                    display: flex;
                    align-items: center;
                    text-decoration: none;
                }

                ::slotted(h1) {
                    margin: 0;
                    padding-left: 5px;
                    font-size: 1.5rem;
                    line-height: 2rem;
                    font-weight: 700;
                    color: var(--primary-900, #1e3a8a);
                }

                ::slotted(nav) {
                    margin-left: auto;
                }
            </style>
            <slot></slot>
        `;
    }
}

// 'aits-header'라는 이름으로 커스텀 엘리먼트를 등록합니다.
customElements.define('aits-header', AitsHeader, { extends: 'header' });