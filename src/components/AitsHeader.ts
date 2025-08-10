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

    /**
     * 1. 부모의 render()를 호출하여 데이터 바인딩된 템플릿으로 Shadow DOM을 채웁니다.
     * 2. 그 후에 AitsHeader 고유의 스타일만 Shadow DOM의 맨 앞에 추가합니다.
     */
    protected render() {
        // 1. 부모 클래스의 render()를 호출합니다.
        //    이 시점에 this.shadow.innerHTML은 데이터가 적용된 템플릿으로 채워집니다.
        super.render();

        // 2. DOM 요소를 직접 생성하여 스타일을 주입합니다.
        //    이 방식은 기존의 렌더링된 내용을 건드리지 않고 스타일만 추가하므로
        //    더 효율적이고 안전합니다.
        const style = document.createElement('style');
        style.textContent = `
            :host {
                position: fixed;
                width: 100%;
                top: 0;
                left: 0;
                box-sizing: border-box;
                display: flex;
                align-items: center;
                padding: 10px 20px;
                background-color: var(--surface-color, #ffffff);
                border-bottom: 1px solid var(--border-color, #e5e7eb);
                z-index: 1000;
                user-select: none;
            }
            
            /* ::slotted() 대신 섀도 DOM 내부의 실제 태그를 직접 스타일링 합니다. */
            a {
                display: flex;
                align-items: center;
                text-decoration: none;
                color: inherit; /* 링크 색상을 부모 요소와 동일하게 */
            }

            h1 {
                margin: 0;
                padding-left: 5px;
                font-size: 1.5rem;
                line-height: 2rem;
                font-weight: 700;
                color: var(--primary-900, #1e3a8a);
            }

            nav {
                margin-left: auto;
            }
            
            nav ul {
                display: flex;
                list-style: none;
                margin: 0;
                padding: 0;
                gap: 1rem;
            }
        `;
        
        // 3. 렌더링된 콘텐츠의 맨 앞에 스타일 요소를 추가합니다.
        this.shadow.prepend(style);
    }
}

// 'aits-header'라는 이름으로 커스텀 엘리먼트를 등록합니다.
customElements.define('aits-header', AitsHeader, { extends: 'header' });