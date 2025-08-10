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
    private _data: object | null = null; // 데이터 저장을 위한 private 속성
    protected template: string = '';       // 초기 템플릿을 저장할 변수
    private _observer: MutationObserver | null = null;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    /**
     * 컴포넌트의 'data' 속성에 접근하기 위한 getter.
     */
    get data(): object | null {
        return this._data;
    }

    /**
     * Controller 등 외부에서 컴포넌트에 데이터를 주입하기 위한 setter.
     * 데이터가 변경되면 자동으로 render()를 호출하여 UI를 업데이트합니다.
     */
    set data(value: object | null) {
        this._data = value;
        this.render();
    }

    /**
     * 컴포넌트가 DOM에 연결될 때 호출됩니다.
     * 이 시점에 초기 HTML을 템플릿으로 저장하고 렌더링을 실행합니다.
     */
    connectedCallback() {
        // 컴포넌트의 초기 자식 HTML을 템플릿으로 저장
        if (!this.template) {
            this.template = this.innerHTML;
            this.innerHTML = ''; // 초기 템플릿이 화면에 잠시 보이는 것을 방지
        }
        this.render();
        this._reconnectObserver(); // Observer 연결
    }

    /**
     * 컴포넌트가 DOM에서 제거될 때 호출됩니다.
     * 메모리 누수를 방지하기 위해 Observer 연결을 해제합니다.
     */
    disconnectedCallback() {
        this._observer?.disconnect();
    }

    /**
     * 컴포넌트의 뷰를 렌더링합니다.
     * 데이터가 있으면 템플릿과 데이터를 바인딩하여 Shadow DOM에 내용을 채웁니다.
     * 하위 클래스에서 필요에 따라 이 메소드를 오버라이드할 수 있습니다.
     */
    protected render() {
        if (!this._data) {
            // 데이터가 없을 때의 기본 동작 (예: 로딩 상태 표시)
            // <slot>을 사용하여 자식 노드로 로딩 상태를 정의할 수 있게 함
            this.shadow.innerHTML = `<slot name="loading">Loading...</slot>`;
            return;
        }

        // 데이터가 있으면, 저장된 템플릿과 현재 데이터를 사용하여 HTML을 생성
        this.shadow.innerHTML = this.simpleTemplate(this.template, this._data);
    }

    /**
     * part 속성 동기화를 위한 MutationObserver를 설정하고 실행합니다.
     * Light DOM의 part 속성 변경을 감지하여 Shadow DOM으로 복제합니다.
     */
    private _reconnectObserver() {
        if (this._observer) this._observer.disconnect();

        // 섀도 루트 내부의 part 속성을 가진 모든 요소를 추적합니다.
        const shadowParts = Array.from(this.shadow.querySelectorAll('[part]'));
        if (shadowParts.length === 0) return; // 추적할 part가 없으면 실행하지 않음

        const partMap = new Map<string, Element[]>();
        shadowParts.forEach(element => {
            const partName = element.getAttribute('part')!;
            if (!partMap.has(partName)) {
                partMap.set(partName, []);
            }
            partMap.get(partName)!.push(element);
        });

        const callback = (mutationsList: MutationRecord[]) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'part') {
                    const target = mutation.target as Element;
                    const lightParts = (target.getAttribute('part') || '').split(' ').filter(p => p);
                    
                    // Shadow DOM의 모든 part를 순회하며 클래스처럼 동기화
                    partMap.forEach((elements, partName) => {
                        elements.forEach(shadowElement => {
                            if (lightParts.includes(partName)) {
                                shadowElement.setAttribute('part', partName);
                            }
                        });
                    });
                }
            }
        };

        this._observer = new MutationObserver(callback);
        this._observer.observe(this, {
            attributes: true,       // 호스트 요소의 속성 변경 감지
            attributeFilter: ['part'], // 'part' 속성에만 집중
            subtree: true,          // 자식 요소의 변경도 감지
        });
        
        // 초기 동기화 실행
        this._syncParts();
    }
    
    /**
     * Light DOM과 Shadow DOM 간의 part 속성을 즉시 동기화합니다.
     */
    private _syncParts() {
        // 호스트(this)에 정의된 part 속성을 섀도 루트의 첫 번째 자식에게 복사
        const hostParts = this.getAttribute('part');
        if (hostParts && this.shadow.firstElementChild) {
            this.shadow.firstElementChild.setAttribute('part', hostParts);
        }
    
        // 자식(Light DOM)에 정의된 part 속성을 이름이 같은 섀도 요소에 복사
        const lightPartElements = this.querySelectorAll('[part]');
        lightPartElements.forEach(lightElement => {
            const partValue = lightElement.getAttribute('part');
            if(partValue) {
                const shadowElement = this.shadow.querySelector(`[part="${partValue}"]`);
                if(shadowElement) {
                    // 이미 존재하는 part 속성을 그대로 유지하면서 클래스처럼 추가/제어 가능
                    // 이 예제에서는 간단히 덮어쓰기로 구현
                    shadowElement.setAttribute('part', partValue);
                }
            }
        });
    }


    /**
     * Controller에 이벤트를 전달하기 위한 표준 메소드입니다.
     * @param eventName - 이벤트 이름 (예: 'aits-search')
     * @param detail - 이벤트와 함께 전달할 데이터
     */
    protected dispatchEventToController(eventName: string, detail: any) {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true,
            composed: true
        }));
    }

    /**
     * 간단한 템플릿 렌더링 헬퍼. (기능 개선 버전)
     * DOM 구조를 분석하여 <template> 태그 내부에 있는 플레이스홀더는 무시합니다.
     * @param templateHtml - HTML 템플릿 문자열
     * @param data - 템플릿에 채워넣을 데이터 객체
     * @returns 데이터가 채워진 HTML 문자열
     */
    protected simpleTemplate(templateHtml: string, data: object): string {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = templateHtml;

        // TreeWalker를 사용해 모든 텍스트 노드를 순회합니다.
        const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
        const nodesToProcess: Node[] = [];

        while (walker.nextNode()) {
            const currentNode = walker.currentNode;
            let inTemplateTag = false;
            let parent = currentNode.parentNode;

            // 현재 노드의 상위 노드 중 <template>이 있는지 확인합니다.
            while (parent && parent !== tempDiv) {
                if (parent.nodeName === 'TEMPLATE') {
                    inTemplateTag = true;
                    break;
                }
                parent = parent.parentNode;
            }

            // <template> 태그 안에 있지 않고, 플레이스홀더를 포함하는 경우에만 처리 목록에 추가합니다.
            if (!inTemplateTag && currentNode.nodeValue?.includes('${')) {
                nodesToProcess.push(currentNode);
            }
        }

        // 실제 치환 작업은 순회가 끝난 후 일괄 처리합니다.
        nodesToProcess.forEach(node => {
            if (node.nodeValue) {
                node.nodeValue = node.nodeValue.replace(/\$\{(\w+|\w+\.\w+)\}/g, (match, key) => {
                    const value = key.split('.').reduce((o: any, k: string) => (o || {})[k], data);
                    return value !== undefined ? String(value) : '';
                });
            }
        });

        return tempDiv.innerHTML;
    }
}