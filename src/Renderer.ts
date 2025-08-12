/**
 * =================================================================
 * Renderer.ts - 지능적인 뷰 및 컴포넌트 관리자
 * =================================================================
 * @description
 * - Loader로부터 받은 HTML 텍스트를 실제 DOM으로 렌더링하는 역할을 전담합니다.
 * - HTML 내 'is="aits-*"' 속성을 가진 요소를 자동으로 Aits 웹 컴포넌트로 변환하고 생명주기를 관리합니다.
 * - Controller의 상태(state) 변경에 반응하여 필요한 부분만 다시 렌더링하는 반응형 UI 시스템의 핵심입니다.
 * @author Aits Framework AI (by parkjunwoo)
 * @version 0.1.0
 */

import type { Aits } from './Aits';
import { AitsElement } from './components/AitsElement';

// 컴포넌트 클래스를 동적으로 찾기 위한 타입
type ComponentConstructor = new (...args: any[]) => AitsElement;

export class Renderer {
    private aits: Aits;
    
    // **수정**: 관리 중인 컴포넌트 인스턴스를 저장합니다. DOM 요소를 Key로 사용하여 ID 유무와 상관없이 모든 컴포넌트를 관리합니다.
    // **WeakMap**을 사용하여 DOM에서 요소가 제거될 때 자동으로 메모리에서 해제되어 메모리 누수를 방지합니다.
    private componentInstances: WeakMap<HTMLElement, AitsElement>; 
    
    // 'aits-list' -> AitsList 클래스 처럼 is값과 실제 클래스를 매핑
    private componentRegistry: Map<string, ComponentConstructor>;

    public constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
        this.componentInstances = new WeakMap();
        this.componentRegistry = new Map();

        // TODO: AitsElement를 상속하는 모든 컴포넌트를 자동으로 등록하는 로직 추가
    }
    
    /**
     * is 값과 컴포넌트 클래스를 등록합니다.
     * @param isValue - 'aits-article'과 같은 is 속성 값
     * @param componentClass - 해당 컴포넌트의 생성자
     */
    public register(isValue: string, componentClass: ComponentConstructor) {
        this.componentRegistry.set(isValue, componentClass);
    }

    /**
     * HTML 텍스트를 받아와 파싱하고 Aits 컴포넌트를 활성화한 후,
     * 실제 DOM에 렌더링합니다.
     * @param html - 렌더링할 HTML 원본 텍스트
     * @returns 렌더링된 최상위 HTMLElement
     */
    public render(html: string): HTMLElement {
        const fragment = document.createRange().createContextualFragment(html);
        const potentialComponents = fragment.querySelectorAll('[is^="aits-"]');

        potentialComponents.forEach((el) => {
            const element = el as HTMLElement;
            const isValue = element.getAttribute('is');
            
            if (isValue && this.componentRegistry.has(isValue)) {
                element.removeAttribute('is');
                const ComponentClass = this.componentRegistry.get(isValue)!;
                const instance = new ComponentClass();

                while(element.firstChild) {
                    instance.appendChild(element.firstChild);
                }
                for (const attr of Array.from(element.attributes)) {
                    instance.setAttribute(attr.name, attr.value);
                }

                element.parentNode?.replaceChild(instance, element);
                
                // **수정**: 생성된 인스턴스를 실제 DOM 요소(instance)를 키로 하여 WeakMap에 저장합니다.
                this.componentInstances.set(instance, instance);
            }
        });
        
        const mainElement = document.createElement('div');
        mainElement.appendChild(fragment);
        return mainElement.firstElementChild as HTMLElement;
    }
    
    /**
     * **개선**: 모든 표준 CSS 셀렉터를 사용하여 관리되고 있는 컴포넌트 인스턴스를 조회합니다.
     * @param selector - 조회할 컴포넌트의 CSS 셀렉터 (e.g., '#userInfo', '.card', 'article[data-id="123"]')
     * @returns AitsElement 인스턴스 또는 undefined
     */
    public query<T extends AitsElement>(selector: string): T | undefined {
        // 1. 먼저 문서 전체에서 셀렉터에 해당하는 DOM 요소를 찾습니다.
        const targetElement = document.querySelector(selector) as HTMLElement | null;
        
        if (targetElement) {
            // 2. 찾은 DOM 요소를 키로 사용하여 WeakMap에서 컴포넌트 인스턴스를 가져옵니다.
            return this.componentInstances.get(targetElement) as T | undefined;
        }
        
        return undefined;
    }

    /**
     * 상태 변경에 따라 특정 뷰(컴포넌트)를 새로운 데이터로 다시 렌더링합니다.
     * @param targetElement - 다시 렌더링할 현재 DOM의 요소
     * @param viewPath - 해당 요소의 원본 HTML 파일 경로
     * @param data - 템플릿에 바인딩할 새로운 데이터 객체
     */
    public async rerender(targetElement: HTMLElement, viewPath: string, data: object): Promise<void> {
        // Loader를 통해 원본 HTML 템플릿을 가져옵니다.
        const templateHtml = await this.aits.getView(viewPath);
        if (!templateHtml) return;

        // 템플릿과 새 데이터를 바인딩합니다.
        const newHtml = this.simpleTemplate(templateHtml, data);

        // 새 HTML로 새로운 DOM 요소를 생성하고 컴포넌트를 활성화합니다.
        const newElement = this.render(newHtml);
        
        // 기존 요소를 새로 렌더링된 요소로 교체합니다.
        targetElement.parentNode?.replaceChild(newElement, targetElement);
        
        // **중요**: WeakMap은 키(DOM 요소)가 교체되면 자동으로 옛날 인스턴스를 제거해주므로
        // 별도의 인스턴스 맵 갱신 코드가 필요 없습니다.
    }
    
    /**
     * 간단한 템플릿 렌더링 헬퍼.
     */
    private simpleTemplate(templateHtml: string, data: object): string {
        // 간단한 예시. 실제로는 중첩 객체(e.g. user.name)도 지원하는 더 정교한 로직이 필요합니다.
        return templateHtml.replace(/\$\{(\w+|\w+\.\w+)\}/g, (match, key) => {
            const value = key.split('.').reduce((o: any, k: string) => (o || {})[k], data);
            return value !== undefined ? String(value) : '';
        });
    }
}