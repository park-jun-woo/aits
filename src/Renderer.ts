/**
 * =================================================================
 * Renderer.ts - 지능적인 뷰 및 레이아웃 관리자 (개선된 버전)
 * =================================================================
 * @description
 * - 메모리 누수 방지와 컴포넌트 중복 등록 체크가 강화된 렌더러
 * @author Aits Framework AI
 * @version 1.1.0
 */

import type { Aits } from './Aits';
import type { Context } from './Context';
import type { LoadingProgress } from './Loader';

// 개선된 컴포넌트 시스템 import
import { 
    COMPONENT_REGISTRY, 
    ComponentUtils,
    AitsElement 
} from './components';

// 레이아웃 구성을 정의하는 인터페이스
export interface LayoutConfig {
    header?: string;      // 헤더 뷰 경로
    footer?: string;      // 푸터 뷰 경로
    main: string | string[];  // 메인 뷰 경로 (다중 뷰 지원)
    aside?: string;       // 사이드바 뷰 경로
    modal?: string;       // 모달 뷰 경로
}

// 전환 효과 옵션
export interface TransitionOptions {
    duration?: number;    // 전환 시간 (ms)
    easing?: string;      // 이징 함수
    direction?: 'forward' | 'backward' | 'none';
}

// 전환 효과 추상 클래스
export abstract class Transition {
    protected minDuration: number = 300;   // 최소 0.3초
    protected maxDuration: number = 1000;  // 최대 1초
    protected progress: number = 0;
    protected startTime: number = 0;
    protected actualDuration: number = 300;
    
    public async execute(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement,
        options: TransitionOptions = {}
    ): Promise<void> {
        this.startTime = performance.now();
        this.actualDuration = options.duration || this.minDuration;
        
        await this.prepare(fromElement, toElement, container, options);
        await this.animate(fromElement, toElement, container, options);
        await this.cleanup(fromElement, toElement, container);
    }
    
    public updateProgress(loadingProgress: number): void {
        this.progress = loadingProgress;
        
        const elapsed = performance.now() - this.startTime;
        const expectedDuration = Math.min(
            Math.max(this.minDuration / loadingProgress, this.minDuration),
            this.maxDuration
        );
        
        if (elapsed < expectedDuration) {
            this.actualDuration = expectedDuration;
        }
    }
    
    protected abstract prepare(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement,
        options: TransitionOptions
    ): Promise<void>;
    
    protected abstract animate(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement,
        options: TransitionOptions
    ): Promise<void>;
    
    protected abstract cleanup(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement
    ): Promise<void>;
}

// 기본 전환 효과 구현
export class FadeTransition extends Transition {
    protected async prepare(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement,
        options: TransitionOptions
    ): Promise<void> {
        toElement.style.opacity = '0';
        toElement.style.transition = `opacity ${this.actualDuration}ms ${options.easing || 'ease-in-out'}`;
        container.appendChild(toElement);
    }
    
    protected async animate(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement,
        options: TransitionOptions
    ): Promise<void> {
        if (fromElement) {
            fromElement.style.transition = `opacity ${this.actualDuration}ms ${options.easing || 'ease-in-out'}`;
            fromElement.style.opacity = '0';
        }
        
        await new Promise(resolve => requestAnimationFrame(resolve));
        toElement.style.opacity = '1';
        
        await new Promise(resolve => setTimeout(resolve, this.actualDuration));
    }
    
    protected async cleanup(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement
    ): Promise<void> {
        if (fromElement) {
            fromElement.remove();
        }
        toElement.style.transition = '';
        toElement.style.opacity = '';
    }
}

// 전환 효과 없음
export class NoTransition extends Transition {
    protected async prepare(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement,
        options: TransitionOptions
    ): Promise<void> {
        container.appendChild(toElement);
    }
    
    protected async animate(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement,
        options: TransitionOptions
    ): Promise<void> {
        // 애니메이션 없음
    }
    
    protected async cleanup(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement
    ): Promise<void> {
        if (fromElement) {
            fromElement.remove();
        }
    }
}

// 슬라이드 전환 효과
export class SlideTransition extends Transition {
    protected async prepare(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement,
        options: TransitionOptions
    ): Promise<void> {
        const direction = options.direction || 'forward';
        const offset = direction === 'forward' ? '100%' : '-100%';
        
        toElement.style.transform = `translateX(${offset})`;
        toElement.style.transition = `transform ${this.actualDuration}ms ${options.easing || 'ease-in-out'}`;
        container.appendChild(toElement);
    }
    
    protected async animate(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement,
        options: TransitionOptions
    ): Promise<void> {
        const direction = options.direction || 'forward';
        
        if (fromElement) {
            const offset = direction === 'forward' ? '-100%' : '100%';
            fromElement.style.transition = `transform ${this.actualDuration}ms ${options.easing || 'ease-in-out'}`;
            fromElement.style.transform = `translateX(${offset})`;
        }
        
        await new Promise(resolve => requestAnimationFrame(resolve));
        toElement.style.transform = 'translateX(0)';
        
        await new Promise(resolve => setTimeout(resolve, this.actualDuration));
    }
    
    protected async cleanup(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement
    ): Promise<void> {
        if (fromElement) {
            fromElement.remove();
        }
        toElement.style.transition = '';
        toElement.style.transform = '';
    }
}

// 렌더링된 뷰 정보
interface RenderedView {
    element: HTMLElement;
    template: string;
}

// 컴포넌트 등록 정보
interface ComponentRegistration {
    component: AitsElement;
    type: string;
    registeredAt: number;
}

export class Renderer {
    private aits: Aits;
    
    // 현재 레이아웃 구성
    private currentLayout: {
        header?: RenderedView;
        footer?: RenderedView;
        main?: RenderedView;
        aside?: RenderedView;
        modal?: RenderedView;
    } = {};
    
    // 활성화된 컴포넌트 추적 (중복 체크 강화)
    private activeComponents: Map<AitsElement, ComponentRegistration> = new Map();
    private componentsByType: Map<string, Set<AitsElement>> = new Map();
    private componentsByElement: WeakMap<HTMLElement, AitsElement> = new WeakMap();
    
    // 현재 실행 중인 전환 효과
    private activeTransition: Transition | null = null;
    
    // 레이아웃 컨테이너 요소들
    private containers: {
        root: HTMLElement;
        header?: HTMLElement;
        main: HTMLElement;
        footer?: HTMLElement;
        aside?: HTMLElement;
        modal?: HTMLElement;
    };
    
    // 메모리 정리 인터벌
    private cleanupInterval: number | null = null;

    public constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
        
        // 레이아웃 컨테이너 초기화
        this.containers = this._initializeContainers();
        
        // 주기적인 메모리 정리 시작
        this._startPeriodicCleanup();
    }
    
    /**
     * HTML 텍스트를 DOM으로 변환하고 is 속성이 있는 요소를 컴포넌트로 활성화
     */
    public render(html: string): HTMLElement {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const fragment = template.content;
        
        // is 속성을 가진 요소들을 컴포넌트로 활성화
        this._activateComponents(fragment);
        
        // 첫 번째 요소 반환 (또는 wrapper div 생성)
        if (fragment.children.length === 1) {
            return fragment.firstElementChild as HTMLElement;
        } else {
            const wrapper = document.createElement('div');
            wrapper.appendChild(fragment);
            return wrapper;
        }
    }
    
    /**
     * Fragment 내의 is 속성을 가진 요소들을 컴포넌트로 활성화
     */
    private _activateComponents(fragment: DocumentFragment): void {
        const elementsWithIs = fragment.querySelectorAll('[is]');
        
        elementsWithIs.forEach(element => {
            const htmlElement = element as HTMLElement;
            const isValue = htmlElement.getAttribute('is');
            
            if (!isValue) return;
            
            // 이미 활성화된 컴포넌트인지 체크
            if (this.componentsByElement.has(htmlElement)) {
                console.warn(`[Renderer] Element already activated as component: ${isValue}`);
                return;
            }
            
            // 시맨틱 태그 검증
            if (!ComponentUtils.isValidSemanticTag(isValue, htmlElement.tagName)) {
                console.warn(`[Renderer] Invalid semantic tag <${htmlElement.tagName.toLowerCase()}> for component ${isValue}`);
                return;
            }
            
            // 컴포넌트 생성
            const component = ComponentUtils.createComponent(isValue);
            if (!component) {
                console.warn(`[Renderer] Unknown component type: ${isValue}`);
                return;
            }
            
            // 속성 복사
            Array.from(htmlElement.attributes).forEach(attr => {
                component.setAttribute(attr.name, attr.value);
            });
            
            // 자식 노드 이동
            while (htmlElement.firstChild) {
                component.appendChild(htmlElement.firstChild);
            }
            
            // DOM에서 교체
            htmlElement.parentNode?.replaceChild(component, htmlElement);
            
            // 컴포넌트 추적
            this._registerComponent(component, isValue);
        });
    }
    
    /**
     * 컴포넌트를 추적 시스템에 등록 (중복 체크 강화)
     */
    private _registerComponent(component: AitsElement, type: string): void {
        // 이미 등록되었는지 확인
        if (this.activeComponents.has(component)) {
            console.warn(`[Renderer] Component already registered: ${type}`);
            return;
        }
        
        // 등록 정보 생성
        const registration: ComponentRegistration = {
            component,
            type,
            registeredAt: Date.now()
        };
        
        // 활성 컴포넌트 맵에 추가
        this.activeComponents.set(component, registration);
        
        // 타입별 그룹화
        if (!this.componentsByType.has(type)) {
            this.componentsByType.set(type, new Set());
        }
        this.componentsByType.get(type)!.add(component);
        
        // 약한 참조로 요소 매핑
        this.componentsByElement.set(component, component);
        
        // 컴포넌트에 활성화 상태 표시
        (component as any).__aitsActivated = true;
        (component as any).__aitsRegisteredAt = registration.registeredAt;
    }
    
    /**
     * 컴포넌트를 추적 시스템에서 제거
     */
    private _unregisterComponent(component: AitsElement): void {
        const registration = this.activeComponents.get(component);
        if (!registration) return;
        
        // 활성 컴포넌트 맵에서 제거
        this.activeComponents.delete(component);
        
        // 타입별 세트에서 제거
        const typeSet = this.componentsByType.get(registration.type);
        if (typeSet) {
            typeSet.delete(component);
            
            // 비어있는 세트 제거
            if (typeSet.size === 0) {
                this.componentsByType.delete(registration.type);
            }
        }
        
        // 약한 참조 제거 (자동으로 가비지 컬렉션됨)
        // this.componentsByElement는 WeakMap이므로 명시적 제거 불필요
        
        // 활성화 상태 제거
        delete (component as any).__aitsActivated;
        delete (component as any).__aitsRegisteredAt;
    }
    
    /**
     * 특정 컨테이너 내의 컴포넌트들을 활성화
     */
    public activateComponentsIn(container: HTMLElement): void {
        // 컨테이너 자체 처리
        if (container.hasAttribute('is')) {
            // 이미 활성화되었는지 확인
            if (!this.componentsByElement.has(container)) {
                const enhanced = ComponentUtils.enhanceElement(container);
                if (enhanced) {
                    this._registerComponent(enhanced, enhanced.getAttribute('is')!);
                }
            }
        }
        
        // 하위 요소들 처리
        const elementsWithIs = container.querySelectorAll('[is]');
        elementsWithIs.forEach(element => {
            const htmlElement = element as HTMLElement;
            
            // 이미 활성화되었는지 확인
            if (!this.componentsByElement.has(htmlElement)) {
                const enhanced = ComponentUtils.enhanceElement(htmlElement);
                if (enhanced) {
                    this._registerComponent(enhanced, enhanced.getAttribute('is')!);
                }
            }
        });
    }
    
    // === 컴포넌트 검색 메서드 ===
    
    /**
     * 단일 컴포넌트를 검색
     */
    public query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
        // 활성화된 컴포넌트 중에서 검색
        for (const [component] of this.activeComponents) {
            if (component.matches(selector)) {
                return component as unknown as T;
            }
        }
        
        // 일반 DOM 요소 검색
        return document.querySelector(selector) as T | null;
    }
    
    /**
     * 모든 매칭 컴포넌트를 검색
     */
    public queryAll<T extends HTMLElement = HTMLElement>(selector: string): T[] {
        const results: T[] = [];
        const seen = new Set<Element>();
        
        // 활성화된 컴포넌트 중에서 검색
        for (const [component] of this.activeComponents) {
            if (component.matches(selector)) {
                results.push(component as unknown as T);
                seen.add(component);
            }
        }
        
        // 일반 DOM 요소도 포함
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (!seen.has(el)) {
                results.push(el as T);
            }
        });
        
        return results;
    }
    
    /**
     * 특정 타입의 컴포넌트만 검색
     * @param componentType - 컴포넌트 타입 (is 속성값)
     * @returns 해당 타입의 컴포넌트 배열
     */
    public queryByType(componentType: string): AitsElement[] {
        const components = this.componentsByType.get(componentType);
        return components ? Array.from(components) : [];
    }
    
    /**
     * 특정 타입의 컴포넌트를 검색하고 타입 캐스팅
     * @param componentType - 컴포넌트 타입 (is 속성값)
     * @returns 타입 캐스팅된 컴포넌트 배열
     */
    public queryByTypeAs<T extends AitsElement>(componentType: string): T[] {
        const components = this.componentsByType.get(componentType);
        return components ? Array.from(components) as T[] : [];
    }
    
    /**
     * 컨테이너 내에서 컴포넌트를 검색
     */
    public queryIn<T extends HTMLElement = HTMLElement>(
        container: HTMLElement | null,
        selector: string
    ): T | null {
        if (!container) return null;
        
        // 컨테이너 내의 활성화된 컴포넌트 검색
        for (const [component] of this.activeComponents) {
            if (container.contains(component) && component.matches(selector)) {
                return component as unknown as T;
            }
        }
        
        // 일반 DOM 요소 검색
        return container.querySelector(selector) as T | null;
    }
    
    /**
     * 컨테이너 내의 모든 매칭 컴포넌트를 검색
     */
    public queryAllIn<T extends HTMLElement = HTMLElement>(
        container: HTMLElement | null,
        selector: string
    ): T[] {
        if (!container) return [];
        
        const results: T[] = [];
        const seen = new Set<Element>();
        
        // 컨테이너 내의 활성화된 컴포넌트 검색
        for (const [component] of this.activeComponents) {
            if (container.contains(component) && component.matches(selector)) {
                results.push(component as unknown as T);
                seen.add(component);
            }
        }
        
        // 일반 DOM 요소도 포함
        const elements = container.querySelectorAll(selector);
        elements.forEach(el => {
            if (!seen.has(el)) {
                results.push(el as T);
            }
        });
        
        return results;
    }
    
    /**
     * 컴포넌트가 활성화되었는지 확인
     */
    public isComponentActivated(element: HTMLElement): boolean {
        return this.componentsByElement.has(element) ||
               (element as any).__aitsActivated === true;
    }
    
    // === 레이아웃 관리 ===
    
    /**
     * 레이아웃을 구성하고 뷰를 렌더링
     */
    public async renderLayout(
        config: LayoutConfig,
        context: Context,
        transition?: Transition,
        options?: TransitionOptions
    ): Promise<void> {
        // 전환 효과 설정
        this.activeTransition = transition || new NoTransition();
        
        // 헤더 렌더링
        if (config.header && config.header !== this.currentLayout.header?.template) {
            await this._renderLayoutSection('header', config.header, context);
        }
        
        // 푸터 렌더링
        if (config.footer && config.footer !== this.currentLayout.footer?.template) {
            await this._renderLayoutSection('footer', config.footer, context);
        }
        
        // 사이드바 렌더링
        if (config.aside) {
            await this._renderLayoutSection('aside', config.aside, context);
        }
        
        // 메인 콘텐츠 렌더링 (전환 효과 적용)
        const mainViews = Array.isArray(config.main) ? config.main : [config.main];
        await this._renderMainContent(mainViews, context, options);
        
        // 모달 렌더링
        if (config.modal) {
            await this._renderModal(config.modal, context);
        }
    }
    
    /**
     * 현재 레이아웃을 정리 (메모리 누수 방지 강화)
     */
    public clearLayout(): void {
        // 모든 활성 컴포넌트 정리
        const componentsToRemove = Array.from(this.activeComponents.keys());
        
        componentsToRemove.forEach(component => {
            try {
                component.destroy();
            } catch (error) {
                console.error('[Renderer] Error destroying component:', error);
            }
            this._unregisterComponent(component);
        });
        
        // 맵 완전 정리
        this.activeComponents.clear();
        this.componentsByType.clear();
        // WeakMap은 자동으로 가비지 컬렉션됨
        
        // 레이아웃 정보 초기화
        this.currentLayout = {};
        
        // DOM 요소 제거
        if (this.containers.header) {
            this.containers.header.innerHTML = '';
        }
        if (this.containers.footer) {
            this.containers.footer.innerHTML = '';
        }
        if (this.containers.aside) {
            this.containers.aside.innerHTML = '';
        }
        if (this.containers.main) {
            this.containers.main.innerHTML = '';
        }
    }
    
    /**
     * 특정 레이아웃 섹션만 제거
     */
    public clearSection(section: keyof typeof this.currentLayout): void {
        const view = this.currentLayout[section];
        if (view) {
            // 섹션 내의 컴포넌트들 제거
            const componentsToRemove: AitsElement[] = [];
            
            this.activeComponents.forEach((registration, component) => {
                if (view.element.contains(component)) {
                    componentsToRemove.push(component);
                }
            });
            
            componentsToRemove.forEach(component => {
                try {
                    component.destroy();
                } catch (error) {
                    console.error('[Renderer] Error destroying component:', error);
                }
                this._unregisterComponent(component);
            });
            
            view.element.remove();
            delete this.currentLayout[section];
        }
    }
    
    // === Private Helper Methods ===
    
    /**
     * 레이아웃 컨테이너를 초기화
     */
    private _initializeContainers(): typeof this.containers {
        let root = document.getElementById('aits-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'aits-root';
            root.className = 'aits-layout';
            document.body.appendChild(root);
        }
        
        let main = root.querySelector<HTMLElement>('[data-aits-main]');
        if (!main) {
            main = document.createElement('main');
            main.dataset.aitsMain = 'true';
            root.appendChild(main);
        }
        
        return { root, main };
    }
    
    /**
     * 레이아웃 섹션을 렌더링
     */
    private async _renderLayoutSection(
        section: 'header' | 'footer' | 'aside',
        templatePath: string,
        context: Context
    ): Promise<void> {
        const html = await this.aits.html(templatePath);
        const element = this.render(html);
        
        if (!this.containers[section]) {
            const container = document.createElement(section);
            container.dataset[`aits${section.charAt(0).toUpperCase() + section.slice(1)}`] = 'true';
            
            if (section === 'header') {
                this.containers.root.prepend(container);
            } else if (section === 'footer') {
                this.containers.root.appendChild(container);
            } else {
                this.containers.main.parentNode?.insertBefore(container, this.containers.main);
            }
            
            this.containers[section] = container;
        }
        
        if (this.currentLayout[section]) {
            this.currentLayout[section]!.element.remove();
        }
        
        this.containers[section]!.appendChild(element);
        
        this.currentLayout[section] = {
            element,
            template: templatePath
        };
    }
    
    /**
     * 메인 콘텐츠를 렌더링
     */
    private async _renderMainContent(
        viewPaths: string[],
        context: Context,
        options?: TransitionOptions
    ): Promise<void> {
        const container = document.createElement('div');
        container.className = 'aits-main-content';
        
        // 로딩 진행률 추적
        const loadPromises = viewPaths.map(async (path) => {
            const html = await this.aits.html(path, {
                onProgress: (progress) => this.updateLoadingProgress(progress)
            });
            return this.render(html);
        });
        
        const elements = await Promise.all(loadPromises);
        elements.forEach(el => container.appendChild(el));
        
        const oldMain = this.currentLayout.main?.element || null;
        
        // 전환 효과 실행
        if (this.activeTransition) {
            await this.activeTransition.execute(
                oldMain,
                container,
                this.containers.main,
                options
            );
        } else {
            if (oldMain) oldMain.remove();
            this.containers.main.appendChild(container);
        }
        
        this.currentLayout.main = {
            element: container,
            template: viewPaths.join(',')
        };
    }
    
    /**
     * 모달을 렌더링
     */
    private async _renderModal(
        modalPath: string,
        context: Context
    ): Promise<void> {
        const html = await this.aits.html(modalPath);
        const element = this.render(html);
        
        // 모달 컴포넌트 찾기
        const modal = element.querySelector('[is="aits-modal"]') as AitsElement;
        if (modal && 'open' in modal) {
            (modal as any).open();
        }
        
        document.body.appendChild(element);
        
        this.currentLayout.modal = {
            element,
            template: modalPath
        };
    }
    
    /**
     * 로딩 진행률을 전환 효과에 전달
     */
    public updateLoadingProgress(progress: LoadingProgress): void {
        if (this.activeTransition) {
            this.activeTransition.updateProgress(progress.progress);
        }
    }
    
    /**
     * DOM에서 제거된 컴포넌트들 정리
     */
    private _cleanupStaleComponents(): void {
        const staleComponents: AitsElement[] = [];
        
        this.activeComponents.forEach((registration, component) => {
            if (!document.body.contains(component)) {
                staleComponents.push(component);
            }
        });
        
        staleComponents.forEach(component => {
            this._unregisterComponent(component);
        });
        
        if (staleComponents.length > 0) {
            console.log(`[Renderer] Cleaned up ${staleComponents.length} stale components`);
        }
    }
    
    /**
     * 주기적인 메모리 정리 시작
     */
    private _startPeriodicCleanup(): void {
        // 30초마다 정리
        this.cleanupInterval = window.setInterval(() => {
            this._cleanupStaleComponents();
        }, 30000);
    }
    
    /**
     * 렌더러 파괴
     */
    public destroy(): void {
        // 정리 인터벌 중지
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        // 모든 컴포넌트 정리
        this.clearLayout();
        
        // 컨테이너 제거
        this.containers.root?.remove();
    }
}