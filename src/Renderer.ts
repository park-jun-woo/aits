/**
 * =================================================================
 * Renderer.ts - 지능적인 뷰 및 레이아웃 관리자
 * =================================================================
 * @description
 * - HTML 텍스트를 DOM으로 변환하고, 레이아웃을 구성하며, 전환 효과를 실행합니다.
 * - Web Component 인스턴스를 관리하고, 상태 변경에 따른 자동 재렌더링을 처리합니다.
 * - customElements.define 대신 is 속성 기반 컴포넌트 활성화를 직접 처리합니다.
 * @author Aits Framework AI
 * @version 0.4.0
 */

import type { Aits } from './Aits';
import type { Context } from './Context';
import type { LoadingProgress } from './Loader';

// 컴포넌트 import
import { AitsElement } from './components/AitsElement';
import { AitsList } from './components/AitsList';
import { AitsArticle } from './components/AitsArticle';
import { AitsForm } from './components/AitsForm';
import { AitsHeader } from './components/AitsHeader';
import { AitsFooter } from './components/AitsFooter';
import { AitsPage } from './components/AitsPage';
import { AitsNav } from './components/AitsNav';
import { AitsMore } from './components/AitsMore';
import { AitsOrder } from './components/AitsOrder';
import { AitsSearch } from './components/AitsSearch';

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

// 컴포넌트 생성자 타입
type ComponentConstructor = new () => HTMLElement;

// 렌더링된 뷰 정보
interface RenderedView {
    element: HTMLElement;
    template: string;
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
    
    // 컴포넌트 레지스트리 (is 값 -> 클래스 매핑)
    private componentRegistry: Map<string, ComponentConstructor>;
    
    // 활성화된 컴포넌트 추적 시스템
    private componentInstances: WeakMap<HTMLElement, AitsElement>;  // DOM 요소 -> 컴포넌트 인스턴스
    private componentsByType: Map<string, Set<HTMLElement>>;        // is 값 -> DOM 요소들
    private allActiveComponents: Set<HTMLElement>;                  // 모든 활성 컴포넌트
    
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
    
    // 상태와 뷰의 바인딩 관계
    private stateBindings: Map<string, Set<{ view: RenderedView; template: string }>>;

    public constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
        this.componentRegistry = new Map();
        this.componentInstances = new WeakMap();
        this.componentsByType = new Map();
        this.allActiveComponents = new Set();
        this.stateBindings = new Map();
        
        // 레이아웃 컨테이너 초기화
        this.containers = this._initializeContainers();
        
        // 기본 컴포넌트 등록
        this._registerDefaultComponents();
    }
    
    /**
     * 기본 컴포넌트를 등록합니다.
     */
    private _registerDefaultComponents(): void {
        this.componentRegistry.set('aits-list', AitsList as any);
        this.componentRegistry.set('aits-article', AitsArticle as any);
        this.componentRegistry.set('aits-form', AitsForm as any);
        this.componentRegistry.set('aits-header', AitsHeader as any);
        this.componentRegistry.set('aits-footer', AitsFooter as any);
        this.componentRegistry.set('aits-page', AitsPage as any);
        this.componentRegistry.set('aits-nav', AitsNav as any);
        this.componentRegistry.set('aits-more', AitsMore as any);
        this.componentRegistry.set('aits-order', AitsOrder as any);
        this.componentRegistry.set('aits-search', AitsSearch as any);
    }
    
    /**
     * 컴포넌트 클래스를 등록합니다.
     */
    public register(isValue: string, componentClass: ComponentConstructor): void {
        this.componentRegistry.set(isValue, componentClass);
    }
    
    /**
     * HTML 텍스트를 DOM으로 변환하고 is 속성이 있는 요소를 컴포넌트로 활성화합니다.
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
     * Fragment 내의 is 속성을 가진 요소들을 컴포넌트로 활성화합니다.
     */
    private _activateComponents(fragment: DocumentFragment): void {
        const elementsWithIs = fragment.querySelectorAll('[is]');
        
        elementsWithIs.forEach(element => {
            const htmlElement = element as HTMLElement;
            const isValue = htmlElement.getAttribute('is');
            
            if (isValue && this.componentRegistry.has(isValue)) {
                const ComponentClass = this.componentRegistry.get(isValue)!;
                const componentInstance = new ComponentClass();
                
                // 기존 요소의 모든 속성을 컴포넌트 인스턴스로 복사
                Array.from(htmlElement.attributes).forEach(attr => {
                    componentInstance.setAttribute(attr.name, attr.value);
                });
                
                // 기존 요소의 모든 자식 노드를 컴포넌트 인스턴스로 이동
                while (htmlElement.firstChild) {
                    componentInstance.appendChild(htmlElement.firstChild);
                }
                
                // DOM에서 기존 요소를 컴포넌트 인스턴스로 교체
                htmlElement.parentNode?.replaceChild(componentInstance, htmlElement);
                
                // 컴포넌트 추적 시스템에 등록
                this._registerComponent(componentInstance, isValue);
            }
        });
    }
    
    /**
     * 컴포넌트를 추적 시스템에 등록합니다.
     */
    private _registerComponent(instance: HTMLElement, type: string): void {
        // 타입별 그룹화
        if (!this.componentsByType.has(type)) {
            this.componentsByType.set(type, new Set());
        }
        this.componentsByType.get(type)!.add(instance);
        
        // 전체 컴포넌트 세트에 추가
        this.allActiveComponents.add(instance);
        
        // 인스턴스 매핑 (AitsElement 타입인 경우만)
        if (instance instanceof AitsElement) {
            this.componentInstances.set(instance, instance);
            // 컴포넌트에 활성화 상태 표시
            (instance as any).__aitsActivated = true;
        }
    }
    
    /**
     * 컴포넌트를 추적 시스템에서 제거합니다.
     */
    private _unregisterComponent(instance: HTMLElement): void {
        // is 속성값 확인
        const isValue = instance.getAttribute('is');
        
        if (isValue && this.componentsByType.has(isValue)) {
            this.componentsByType.get(isValue)!.delete(instance);
            
            // 타입별 세트가 비어있으면 제거
            if (this.componentsByType.get(isValue)!.size === 0) {
                this.componentsByType.delete(isValue);
            }
        }
        
        // 전체 컴포넌트 세트에서 제거
        this.allActiveComponents.delete(instance);
    }
    
    // === 컴포넌트 검색 메서드 ===
    
    /**
     * 단일 컴포넌트를 검색합니다.
     */
    public query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
        // 먼저 활성화된 컴포넌트 중에서 검색
        for (const component of this.allActiveComponents) {
            if (component.matches(selector)) {
                return component as T;
            }
        }
        
        // 일반 DOM 요소 검색
        const element = document.querySelector(selector);
        return element as T | null;
    }
    
    /**
     * 모든 매칭 컴포넌트를 검색합니다.
     */
    public queryAll<T extends HTMLElement = HTMLElement>(selector: string): T[] {
        const results: T[] = [];
        
        // 활성화된 컴포넌트 중에서 검색
        for (const component of this.allActiveComponents) {
            if (component.matches(selector)) {
                results.push(component as T);
            }
        }
        
        // 일반 DOM 요소도 포함
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (!this.allActiveComponents.has(el as HTMLElement)) {
                results.push(el as T);
            }
        });
        
        return results;
    }
    
    /**
     * 특정 타입의 컴포넌트만 검색합니다.
     */
    public queryByType<T extends HTMLElement = HTMLElement>(componentType: string): T[] {
        const components = this.componentsByType.get(componentType);
        return components ? Array.from(components) as T[] : [];
    }
    
    /**
     * 컨테이너 내에서 컴포넌트를 검색합니다.
     */
    public queryIn<T extends HTMLElement = HTMLElement>(
        container: HTMLElement | null, 
        selector: string
    ): T | null {
        if (!container) return null;
        
        // 컨테이너 내의 활성화된 컴포넌트 검색
        for (const component of this.allActiveComponents) {
            if (container.contains(component) && component.matches(selector)) {
                return component as T;
            }
        }
        
        // 일반 DOM 요소 검색
        return container.querySelector(selector) as T | null;
    }
    
    /**
     * 컨테이너 내의 모든 매칭 컴포넌트를 검색합니다.
     */
    public queryAllIn<T extends HTMLElement = HTMLElement>(
        container: HTMLElement | null, 
        selector: string
    ): T[] {
        if (!container) return [];
        
        const results: T[] = [];
        
        // 컨테이너 내의 활성화된 컴포넌트 검색
        for (const component of this.allActiveComponents) {
            if (container.contains(component) && component.matches(selector)) {
                results.push(component as T);
            }
        }
        
        // 일반 DOM 요소도 포함
        const elements = container.querySelectorAll(selector);
        elements.forEach(el => {
            if (!this.allActiveComponents.has(el as HTMLElement)) {
                results.push(el as T);
            }
        });
        
        return results;
    }
    
    /**
     * 컴포넌트가 활성화되었는지 확인합니다.
     */
    public isComponentActivated(element: HTMLElement): boolean {
        return this.allActiveComponents.has(element) || (element as any).__aitsActivated === true;
    }
    
    /**
     * 특정 요소와 그 하위 요소들의 is 속성을 활성화합니다.
     */
    public activateComponentsIn(container: HTMLElement): void {
        // 컨테이너 자체가 is 속성을 가지고 있는지 확인
        if (container.hasAttribute('is')) {
            const isValue = container.getAttribute('is');
            if (isValue && this.componentRegistry.has(isValue)) {
                const ComponentClass = this.componentRegistry.get(isValue)!;
                const componentInstance = new ComponentClass();
                
                // 속성 복사
                Array.from(container.attributes).forEach(attr => {
                    componentInstance.setAttribute(attr.name, attr.value);
                });
                
                // 자식 노드 이동
                while (container.firstChild) {
                    componentInstance.appendChild(container.firstChild);
                }
                
                // 교체
                container.parentNode?.replaceChild(componentInstance, container);
                this._registerComponent(componentInstance, isValue);
                
                // 교체된 요소를 새로운 컨테이너로 설정
                container = componentInstance;
            }
        }
        
        // 하위 요소들 처리
        const elementsWithIs = container.querySelectorAll('[is]');
        elementsWithIs.forEach(element => {
            const htmlElement = element as HTMLElement;
            const isValue = htmlElement.getAttribute('is');
            
            if (isValue && this.componentRegistry.has(isValue)) {
                const ComponentClass = this.componentRegistry.get(isValue)!;
                const componentInstance = new ComponentClass();
                
                // 속성 복사
                Array.from(htmlElement.attributes).forEach(attr => {
                    componentInstance.setAttribute(attr.name, attr.value);
                });
                
                // 자식 노드 이동
                while (htmlElement.firstChild) {
                    componentInstance.appendChild(htmlElement.firstChild);
                }
                
                // 교체
                htmlElement.parentNode?.replaceChild(componentInstance, htmlElement);
                this._registerComponent(componentInstance, isValue);
            }
        });
    }
    
    // === 레이아웃 관리 ===
    
    /**
     * 레이아웃을 구성하고 뷰를 렌더링합니다.
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
     * 현재 레이아웃을 정리합니다.
     */
    public clearLayout(): void {
        // 모든 활성 컴포넌트 제거
        this.allActiveComponents.forEach(component => {
            this._unregisterComponent(component);
        });
        
        // 모든 섹션의 요소 제거
        Object.entries(this.currentLayout).forEach(([key, view]) => {
            if (view) {
                view.element.remove();
            }
        });
        
        // 레이아웃 정보 초기화
        this.currentLayout = {};
        
        // 바인딩 정보 초기화
        this.stateBindings.clear();
    }
    
    /**
     * 특정 레이아웃 섹션만 제거합니다.
     */
    public clearSection(section: keyof typeof this.currentLayout): void {
        const view = this.currentLayout[section];
        if (view) {
            // 섹션 내의 컴포넌트들 제거
            const componentsToRemove: HTMLElement[] = [];
            this.allActiveComponents.forEach(component => {
                if (view.element.contains(component)) {
                    componentsToRemove.push(component);
                }
            });
            
            componentsToRemove.forEach(component => {
                this._unregisterComponent(component);
            });
            
            view.element.remove();
            delete this.currentLayout[section];
            
            // 해당 섹션의 바인딩 제거
            this._removeViewBindings(view);
        }
    }
    
    // === Private Helper Methods ===
    
    /**
     * 레이아웃 컨테이너를 초기화합니다.
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
        
        return {
            root,
            main
        };
    }
    
    /**
     * 레이아웃 섹션을 렌더링합니다.
     */
    private async _renderLayoutSection(
        section: 'header' | 'footer' | 'aside',
        templatePath: string,
        context: Context
    ): Promise<void> {
        const html = await this.aits.html(templatePath);
        const interpolated = this._interpolateTemplate(html, context.state);
        const element = this.render(interpolated);
        
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
            template: html
        };
    }
    
    /**
     * 메인 콘텐츠를 렌더링합니다.
     */
    private async _renderMainContent(
        viewPaths: string[],
        context: Context,
        options?: TransitionOptions
    ): Promise<void> {
        const container = document.createElement('div');
        container.className = 'aits-main-content';
        
        const loadPromises = viewPaths.map(async (path) => {
            const html = await this.aits.html(path, {
                onProgress: (progress) => this.updateLoadingProgress(progress)
            });
            const interpolated = this._interpolateTemplate(html, context.state);
            return this.render(interpolated);
        });
        
        const elements = await Promise.all(loadPromises);
        elements.forEach(el => container.appendChild(el));
        
        const oldMain = this.currentLayout.main?.element || null;
        
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
     * 모달을 렌더링합니다.
     */
    private async _renderModal(
        modalPath: string,
        context: Context
    ): Promise<void> {
        if (!this.containers.modal) {
            const modalContainer = document.createElement('div');
            modalContainer.id = 'aits-modal';
            modalContainer.className = 'aits-modal-container';
            modalContainer.dataset.aitsModal = 'true';
            document.body.appendChild(modalContainer);
            this.containers.modal = modalContainer;
        }
        
        const html = await this.aits.html(modalPath);
        const interpolated = this._interpolateTemplate(html, context.state);
        const element = this.render(interpolated);
        
        if (this.currentLayout.modal) {
            this.currentLayout.modal.element.remove();
        }
        
        this.containers.modal.appendChild(element);
        this.containers.modal.classList.add('active');
        
        this.currentLayout.modal = {
            element,
            template: html
        };
        
        this.containers.modal.addEventListener('click', (e) => {
            if (e.target === this.containers.modal) {
                this.closeModal();
            }
        }, { once: true });
    }
    
    /**
     * 모달을 닫습니다.
     */
    public closeModal(): void {
        if (this.containers.modal && this.currentLayout.modal) {
            this.containers.modal.classList.remove('active');
            this.currentLayout.modal.element.remove();
            delete this.currentLayout.modal;
        }
    }
    
    /**
     * 로딩 진행률을 전환 효과에 전달합니다.
     */
    public updateLoadingProgress(progress: LoadingProgress): void {
        if (this.activeTransition) {
            this.activeTransition.updateProgress(progress.progress);
        }
    }
    
    // === 상태 바인딩 관련 ===
    
    /**
     * 상태 키와 뷰를 바인딩합니다.
     */
    public bindStateToView(stateKey: string, view: RenderedView): void {
        if (!this.stateBindings.has(stateKey)) {
            this.stateBindings.set(stateKey, new Set());
        }
        this.stateBindings.get(stateKey)!.add({
            view,
            template: view.template
        });
    }
    
    /**
     * 상태 변경 시 바인딩된 뷰들을 재렌더링합니다.
     */
    public async updateBoundViews(stateKey: string, newValue: any, context: Context): Promise<void> {
        const bindings = this.stateBindings.get(stateKey);
        if (!bindings) return;
        
        for (const binding of bindings) {
            if (document.body.contains(binding.view.element)) {
                await this.rerender(
                    binding.view.element,
                    binding.template,
                    { [stateKey]: newValue, ...context.state }
                );
            } else {
                bindings.delete(binding);
            }
        }
    }
    
    /**
     * 특정 뷰를 상태 변경에 따라 재렌더링합니다.
     */
    public async rerender(
        element: HTMLElement,
        template: string,
        newState: any
    ): Promise<void> {
        const html = this._interpolateTemplate(template, newState);
        const newElement = this.render(html);
        
        Array.from(element.attributes).forEach(attr => {
            if (attr.name !== 'id') {
                newElement.setAttribute(attr.name, attr.value);
            }
        });
        
        element.parentNode?.replaceChild(newElement, element);
        this._updateBindings(element, newElement);
    }
    
    /**
     * 템플릿에 데이터를 삽입합니다.
     */
    private _interpolateTemplate(template: string, data: any): string {
        return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            const value = trimmedKey.split('.').reduce((obj: any, k: string) => {
                return obj?.[k];
            }, data);
            
            return value !== undefined ? String(value) : '';
        });
    }
    
    /**
     * 바인딩 정보를 업데이트합니다.
     */
    private _updateBindings(oldElement: HTMLElement, newElement: HTMLElement): void {
        this.stateBindings.forEach(bindings => {
            bindings.forEach(binding => {
                if (binding.view.element === oldElement) {
                    binding.view.element = newElement;
                }
            });
        });
    }
    
    /**
     * 특정 뷰의 바인딩을 제거합니다.
     */
    private _removeViewBindings(view: RenderedView): void {
        this.stateBindings.forEach(bindings => {
            const toRemove: any[] = [];
            bindings.forEach(binding => {
                if (binding.view === view) {
                    toRemove.push(binding);
                }
            });
            toRemove.forEach(binding => bindings.delete(binding));
        });
    }
}