/**
 * =================================================================
 * AITS 컴포넌트 시스템 - 중앙 내보내기
 * =================================================================
 * @description
 * 모든 AITS 컴포넌트를 중앙에서 관리하고 내보냅니다.
 * Renderer가 이 컴포넌트들을 자동으로 등록합니다.
 * @author Aits Framework AI
 * @version 1.0.0
 */

// 기반 클래스
export { 
    AitsElement,
    type ComponentSize,
    type ComponentVariant,
    type ComponentState,
    type AitsEventOptions
} from './AitsElement';

// 데이터 컴포넌트
export { AitsList } from './AitsList';
export { AitsArticle } from './AitsArticle';
export { AitsCard } from './AitsCard';

// 레이아웃 컴포넌트
export { AitsPage } from './AitsPage';
export { AitsHeader } from './AitsHeader';
export { AitsFooter } from './AitsFooter';
export { AitsNav } from './AitsNav';
export { AitsSidebar } from './AitsSidebar';

// 인터랙션 컴포넌트
export { AitsForm } from './AitsForm';
export { AitsButton } from './AitsButton';
export { AitsInput } from './AitsInput';
export { AitsSearch } from './AitsSearch';
export { AitsFilter } from './AitsFilter';
export { 
    AitsSort, 
    AitsSortGroup,
    type SortDirection,
    type SortState,
    type SortChangeEvent 
} from './AitsSort';
export { AitsPagination } from './AitsPagination';
export { AitsMore } from './AitsMore';

// 피드백 컴포넌트
export { AitsToast } from './AitsToast';
export { AitsModal } from './AitsModal';
export { AitsProgress } from './AitsProgress';
export { AitsEmpty } from './AitsEmpty';
export { AitsError } from './AitsError';

export { NHNTOASTUIEditor } from './NHNTOASTUIEditor';

// 컴포넌트 레지스트리 맵
import { AitsList } from './AitsList';
import { AitsArticle } from './AitsArticle';
import { AitsCard } from './AitsCard';
import { AitsPage } from './AitsPage';
import { AitsHeader } from './AitsHeader';
import { AitsFooter } from './AitsFooter';
import { AitsNav } from './AitsNav';
import { AitsSidebar } from './AitsSidebar';
import { AitsForm } from './AitsForm';
import { AitsButton } from './AitsButton';
import { AitsInput } from './AitsInput';
import { AitsSearch } from './AitsSearch';
import { AitsFilter } from './AitsFilter';
import { AitsSort, AitsSortGroup } from './AitsSort';
import { AitsPagination } from './AitsPagination';
import { AitsMore } from './AitsMore';
import { AitsToast } from './AitsToast';
import { AitsModal } from './AitsModal';
import { AitsProgress } from './AitsProgress';
import { AitsEmpty } from './AitsEmpty';
import { AitsError } from './AitsError';
import { AitsElement } from './AitsElement';
import { NHNTOASTUIEditor } from './NHNTOASTUIEditor';

// 컴포넌트 생성자 타입 정의
type ComponentConstructor = new () => AitsElement;

/**
 * 모든 컴포넌트 매핑
 * is 속성값 -> 컴포넌트 클래스
 */
export const COMPONENT_REGISTRY = new Map<string, ComponentConstructor>([
    // 데이터 컴포넌트
    ['aits-list', AitsList as ComponentConstructor],
    ['aits-article', AitsArticle as ComponentConstructor],
    ['aits-card', AitsCard as ComponentConstructor],
    
    // 레이아웃 컴포넌트
    ['aits-page', AitsPage as ComponentConstructor],
    ['aits-header', AitsHeader as ComponentConstructor],
    ['aits-footer', AitsFooter as ComponentConstructor],
    ['aits-nav', AitsNav as ComponentConstructor],
    ['aits-sidebar', AitsSidebar as ComponentConstructor],
    
    // 인터랙션 컴포넌트
    ['aits-form', AitsForm as ComponentConstructor],
    ['aits-button', AitsButton as ComponentConstructor],
    ['aits-input', AitsInput as ComponentConstructor],
    ['aits-search', AitsSearch as ComponentConstructor],
    ['aits-filter', AitsFilter as ComponentConstructor],
    ['aits-sort', AitsSort as ComponentConstructor],
    ['aits-sort-group', AitsSortGroup as ComponentConstructor],
    ['aits-pagination', AitsPagination as ComponentConstructor],
    ['aits-more', AitsMore as ComponentConstructor],
    
    // 피드백 컴포넌트
    ['aits-toast', AitsToast as ComponentConstructor],
    ['aits-modal', AitsModal as ComponentConstructor],
    ['aits-progress', AitsProgress as ComponentConstructor],
    ['aits-empty', AitsEmpty as ComponentConstructor],
    ['aits-error', AitsError as ComponentConstructor],

    // 외부 래퍼 컴포넌트 추가
    ['toastui-editor', NHNTOASTUIEditor as ComponentConstructor],
]);

export const EXTERNAL_WRAPPER_COMPONENTS  = {
    'toastui-editor': {
        name: 'TOAST UI Editor',
        library: '@toast-ui/editor',
        cdnUrl: 'https://uicdn.toast.com/editor/latest/',
        component: NHNTOASTUIEditor,
        type: 'editor',
        async: true,
        autoRegister: true
    },
};

/**
 * 컴포넌트 타입별 그룹화
 */
export const COMPONENT_GROUPS = {
    data: [
        'aits-list',
        'aits-article', 
        'aits-card'
    ],
    layout: [
        'aits-page',
        'aits-header',
        'aits-footer',
        'aits-nav',
        'aits-sidebar'
    ],
    interaction: [
        'aits-form',
        'aits-button',
        'aits-input',
        'aits-search',
        'aits-filter',
        'aits-sort',
        'aits-sort-group',
        'aits-pagination',
        'aits-more'
    ],
    feedback: [
        'aits-toast',
        'aits-modal',
        'aits-progress',
        'aits-empty',
        'aits-error'
    ],
    external: Object.keys(EXTERNAL_WRAPPER_COMPONENTS)
};

/**
 * 컴포넌트가 사용할 시맨틱 HTML 태그
 */
export const SEMANTIC_TAGS: Record<string, string[]> = {
    // 데이터
    'aits-list': ['ul', 'ol', 'div'],
    'aits-article': ['article'],
    'aits-card': ['div', 'section'],
    
    // 레이아웃
    'aits-page': ['main'],
    'aits-header': ['header'],
    'aits-footer': ['footer'],
    'aits-nav': ['nav'],
    'aits-sidebar': ['aside'],
    
    // 인터랙션
    'aits-form': ['form'],
    'aits-button': ['button', 'a'],
    'aits-input': ['input', 'div'],
    'aits-search': ['div', 'form'],
    'aits-filter': ['div', 'form'],
    'aits-sort': ['button', 'th', 'div'],
    'aits-sort-group': ['div', 'section'],
    'aits-pagination': ['nav'],
    'aits-more': ['button'],
    
    // 피드백
    'aits-toast': ['div'],
    'aits-modal': ['dialog', 'div'],
    'aits-progress': ['div', 'progress'],
    'aits-empty': ['div'],
    'aits-error': ['div'],

    // 외부 컴포넌트
    'toastui-editor': ['div', 'aits-editor'], 
};

/**
 * 컴포넌트 유틸리티 함수
 */
export class ComponentUtils {
    /**
     * is 값으로 컴포넌트 클래스 가져오기
     */
    static getComponentClass(isValue: string): ComponentConstructor | undefined {
        return COMPONENT_REGISTRY.get(isValue);
    }
    
    /**
     * 컴포넌트 타입 확인
     */
    static getComponentGroup(isValue: string): string | null {
        for (const [group, components] of Object.entries(COMPONENT_GROUPS)) {
            if (components.includes(isValue)) {
                return group;
            }
        }
        return null;
    }
    
    /**
     * 시맨틱 태그 검증
     */
    static isValidSemanticTag(isValue: string, tagName: string): boolean {
        const validTags = SEMANTIC_TAGS[isValue];
        return validTags ? validTags.includes(tagName.toLowerCase()) : false;
    }
    
    /**
     * 컴포넌트 인스턴스 생성
     */
    static createComponent(isValue: string): AitsElement | null {
        const ComponentClass = this.getComponentClass(isValue);
        if (ComponentClass) {
            try {
                return new ComponentClass();
            } catch (error) {
                console.error(`Failed to create component ${isValue}:`, error);
                return null;
            }
        }
        return null;
    }
    
    /**
     * 요소를 컴포넌트로 향상
     */
    static enhanceElement(element: HTMLElement): AitsElement | null {
        const isValue = element.getAttribute('is');
        if (!isValue) return null;
        
        const component = this.createComponent(isValue);
        if (!component) return null;
        
        // 속성 복사
        Array.from(element.attributes).forEach(attr => {
            component.setAttribute(attr.name, attr.value);
        });
        
        // 자식 노드 이동
        while (element.firstChild) {
            component.appendChild(element.firstChild);
        }
        
        // DOM에서 교체
        element.parentNode?.replaceChild(component, element);
        
        return component;
    }
    
    /**
     * 모든 컴포넌트를 브라우저에 등록
     * customElements.define을 사용한 Web Components 등록
     */
    static registerAll(): void {
        COMPONENT_REGISTRY.forEach((ComponentClass, isValue) => {
            if (isValue.includes('-')) {
                try {
                    if (!customElements.get(isValue)) {
                        const validTags = SEMANTIC_TAGS[isValue];
                        if (validTags && validTags.length > 0) {
                            const baseTag = validTags[0];
                            
                            // 외부 래퍼 컴포넌트는 autonomous custom element로 등록
                            if (ComponentUtils.isExternalWrapper(isValue)) {
                                customElements.define(isValue, ComponentClass as CustomElementConstructor);
                            } else {
                                // 기존 AITS 컴포넌트는 customized built-in element로 등록
                                customElements.define(isValue, ComponentClass as CustomElementConstructor, { extends: baseTag });
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to register component ${isValue}:`, error);
                }
            }
        });
    }
    
    /**
     * 특정 컴포넌트만 등록
     */
    static register(isValue: string): boolean {
        const ComponentClass = this.getComponentClass(isValue);
        if (!ComponentClass) return false;
        
        const validTags = SEMANTIC_TAGS[isValue];
        if (!validTags || validTags.length === 0) return false;
        
        try {
            if (!customElements.get(isValue)) {
                const baseTag = validTags[0];
                
                // 외부 래퍼 컴포넌트 처리 추가
                if (ComponentUtils.isExternalWrapper(isValue)) {
                    customElements.define(isValue, ComponentClass as CustomElementConstructor);
                } else {
                    customElements.define(isValue, ComponentClass as CustomElementConstructor, { extends: baseTag });
                }
            }
            return true;
        } catch (error) {
            console.warn(`Failed to register component ${isValue}:`, error);
            return false;
        }
    }
    
    /**
     * 컴포넌트가 등록되었는지 확인
     */
    static isRegistered(isValue: string): boolean {
        return !!customElements.get(isValue);
    }
    
    /**
     * 특정 그룹의 컴포넌트 목록
     */
    static getComponentsByGroup(group: keyof typeof COMPONENT_GROUPS): string[] {
        return COMPONENT_GROUPS[group] || [];
    }

    /**
     * 외부 래퍼 컴포넌트인지 확인
     */
    static isExternalWrapper(isValue: string): boolean {
        return isValue in EXTERNAL_WRAPPER_COMPONENTS;
    }
    
    /**
     * 외부 래퍼 컴포넌트 정보 가져오기
     */
    static getExternalWrapperInfo(isValue: string) {
        return EXTERNAL_WRAPPER_COMPONENTS[isValue as keyof typeof EXTERNAL_WRAPPER_COMPONENTS];
    }
    
    /**
     * 컴포넌트가 사용 가능한지 확인 (수정)
     */
    static isComponentAvailable(isValue: string): boolean {
        return COMPONENT_REGISTRY.has(isValue) || 
               this.isExternalWrapper(isValue);
    }
    
    /**
     * 모든 사용 가능한 컴포넌트 목록 (수정)
     */
    static getAvailableComponents(): string[] {
        return [
            ...Array.from(COMPONENT_REGISTRY.keys()),
            ...Object.keys(EXTERNAL_WRAPPER_COMPONENTS)
        ];
    }
}