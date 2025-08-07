/**
 * Aits UI - Web Components Library
 * ---------------------------------
 * 이 파일은 Aits 프레임워크의 모든 UI 웹 컴포넌트 코드를 포함합니다.
 * 각 컴포넌트는 명확한 역할을 가지며, Controller와의 상호작용을 위해
 * CustomEvent를 사용하여 느슨하게 결합되어 있습니다.
 *
 * @author Aits Framework AI
 * @version 0.1.0
 */

// === 1. AitsElement: 모든 컴포넌트의 기반 클래스 ===
/**
 * AitsElement는 모든 aits-* 컴포넌트의 부모 클래스입니다.
 * Shadow DOM 설정, 스타일 주입, 데이터 렌더링 헬퍼 등
 * 공통적인 기능을 제공하여 코드 중복을 최소화합니다.
 */
export class AitsElement extends HTMLElement {
    protected shadow: ShadowRoot;

    constructor() {
        super();
        // 모든 컴포E넌트는 캡슐화를 위해 Shadow DOM을 사용합니다.
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    /**
     * 컴포넌트가 DOM에 연결될 때 호출됩니다.
     * 하위 클래스에서 구체적인 로직을 구현합니다.
     */
    connectedCallback() {
        this.render();
    }

    /**
     * 컴포넌트의 뷰를 렌더링합니다.
     * 하위 클래스에서 이 메소드를 오버라이드하여 UI를 구성합니다.
     */
    protected render() {
        // 기본 렌더링 로직 (필요시 하위 클래스에서 구현)
    }

    /**
     * Controller에 이벤트를 전달하기 위한 표준 메소드입니다.
     * @param eventName - 이벤트 이름 (예: 'aits-search')
     * @param detail - 이벤트와 함께 전달할 데이터
     */
    protected dispatchEventToController(eventName: string, detail: any) {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true, // 이벤트가 DOM 트리를 따라 올라갈 수 있도록 설정
            composed: true // Shadow DOM 경계를 넘어 전파되도록 설정
        }));
    }

    /**
     * 간단한 템플릿 렌더링 헬퍼.
     * 템플릿 문자열의 ${key} 부분을 data 객체의 값으로 치환합니다.
     * @param template - HTML 템플릿 문자열
     * @param data - 템플릿에 채워넣을 데이터 객체
     * @returns 데이터가 채워진 HTML 문자열
     */
    protected simpleTemplate(template: string, data: object): string {
        return template.replace(/\$\{(\w+)\}/g, (match, key) => {
            return data.hasOwnProperty(key) ? String((data as any)[key]) : '';
        });
    }
}