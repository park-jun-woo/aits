// /aits/src/components/AitsFooter.ts

import { AitsElement } from './AitsElement';

/**
 * <footer is="aits-footer">: 페이지의 푸터 영역을 정의하는 컨테이너 컴포넌트.
 * 내부에 슬롯을 두어 자식 요소들을 그대로 표시합니다.
 */
class AitsFooter extends AitsElement {
    constructor() {
        super();
    }

    protected render() {
        this.shadow.innerHTML = `
            <style>
                :host {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    align-items: center;
                    justify-content: end;
                    padding: 0.5rem 1rem;
                    position: fixed;
                    right: 0px;
                    bottom: 0px;
                    z-index: 1000;
                    gap: 0.5rem;
                    
                    /* 기본 배경색과 테두리 설정 */
                    background-color: var(--surface-color, #ffffff);
                    border-top: 1px solid var(--border-color, #e5e7eb);
                    user-select: none;
                }
            </style>
            <slot></slot>
        `;
    }
}

// 'aits-footer'라는 이름으로 커스텀 엘리먼트를 등록합니다.
customElements.define('aits-footer', AitsFooter, { extends: 'footer' });