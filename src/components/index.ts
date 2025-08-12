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
export { AitsSort } from './AitsSort';
export { AitsPagination } from './AitsPagination';
export { AitsMore } from './AitsMore';

// 피드백 컴포넌트
export { AitsToast } from './AitsToast';
export { AitsModal } from './AitsModal';
export { AitsProgress } from './AitsProgress';
export { AitsEmpty } from './AitsEmpty';
export { AitsError } from './AitsError';

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
import { AitsSort } from './AitsSort';
import { AitsPagination } from './AitsPagination';
import { AitsMore } from './AitsMore';
import { AitsToast } from './AitsToast';
import { AitsModal } from './AitsModal';
import { AitsProgress } from './AitsProgress';
import { AitsEmpty } from './AitsEmpty';
import { AitsError } from './AitsError';

/**
 * 모든 컴포넌트 매핑
 * is 속성값 -> 컴포넌트 클래스
 */
export const COMPONENT_REGISTRY = new Map([
    // 데이터 컴포넌트
    ['aits-list', AitsList],
    ['aits-article', AitsArticle],
    ['aits-card', AitsCard],
    
    // 레이아웃 컴포넌트
    ['aits-page', AitsPage],
    ['aits-header', AitsHeader],
    ['aits-footer', AitsFooter],
    ['aits-nav', AitsNav],
    ['aits-sidebar', AitsSidebar],
    
    // 인터랙션 컴포넌트
    ['aits-form', AitsForm],
    ['aits-button', AitsButton],
    ['aits-input', AitsInput],
    ['aits-search', AitsSearch],
    ['aits-filter', AitsFilter],
    ['aits-sort', AitsSort],
    ['aits-pagination', AitsPagination],
    ['aits-more', AitsMore],
    
    // 피드백 컴포넌트
    ['aits-toast', AitsToast],
    ['aits-modal', AitsModal],
    ['aits-progress', AitsProgress],
    ['aits-empty', AitsEmpty],
    ['aits-error', AitsError]
]);

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
        'aits-pagination',
        'aits-more'
    ],
    feedback: [
        'aits-toast',
        'aits-modal',
        'aits-progress',
        'aits-empty',
        'aits-error'
    ]
};

/**
 * 컴포넌트가 사용할 시맨틱 HTML 태그
 */
export const SEMANTIC_TAGS = {
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
    'aits-pagination': ['nav'],
    'aits-more': ['button'],
    
    // 피드백
    'aits-toast': ['div'],
    'aits-modal': ['dialog', 'div'],
    'aits-progress': ['div', 'progress'],
    'aits-empty': ['div'],
    'aits-error': ['div']
};

/**
 * 컴포넌트 유틸리티 함수
 */
export class ComponentUtils {
    /**
     * is 값으로 컴포넌트 클래스 가져오기
     */
    static getComponentClass(isValue: string): typeof AitsElement | undefined {
        return COMPONENT_REGISTRY.get(isValue) as any;
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
        const validTags = SEMANTIC_TAGS[isValue as keyof typeof SEMANTIC_TAGS];
        return validTags ? validTags.includes(tagName.toLowerCase()) : false;
    }
    
    /**
     * 컴포넌트 인스턴스 생성
     */
    static createComponent(isValue: string): AitsElement | null {
        const ComponentClass = this.getComponentClass(isValue);
        if (ComponentClass) {
            return new ComponentClass() as AitsElement;
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
}