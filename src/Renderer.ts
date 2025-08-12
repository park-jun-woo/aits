/**
 * =================================================================
 * Renderer.ts - 지능적인 뷰 및 레이아웃 관리자
 * =================================================================
 * @description
 * - HTML 텍스트를 DOM으로 변환하고, 레이아웃을 구성하며, 전환 효과를 실행합니다.
 * - Web Component 인스턴스를 관리하고, 상태 변경에 따른 자동 재렌더링을 처리합니다.
 * - Scenario.ts와 협력하여 시각적 연출을 담당하지만, 비즈니스 로직에는 관여하지 않습니다.
 * @author Aits Framework AI
 * @version 0.2.0
 */

import type { Aits } from './Aits';
import type { Context } from './Context';
import type { LoadingProgress } from './Loader';
import { AitsElement } from './components/AitsElement';

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
    
    /**
     * 전환 시작
     */
    public async execute(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        container: HTMLElement,
        options: TransitionOptions = {}
    ): Promise<void> {
        this.startTime = performance.now();
        this.actualDuration = options.duration || this.minDuration;
        
        // 전환 준비
        await this.prepare(fromElement, toElement, container, options);
        
        // 전환 실행
        await this.animate(fromElement, toElement, container, options);
        
        // 전환 정리
        await this.cleanup(fromElement, toElement, container);
    }
    
    /**
     * 로딩 진행률 업데이트
     */
    public updateProgress(loadingProgress: number): void {
        this.progress = loadingProgress;
        
        // 진행률에 따라 전환 속도 조절
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
        
        // 다음 프레임에서 페이드 인
        await new Promise(resolve => requestAnimationFrame(resolve));
        toElement.style.opacity = '1';
        
        // 애니메이션 완료 대기
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
type ComponentConstructor = new (...args: any[]) => AitsElement;

// 렌더링된 뷰 정보
interface RenderedView {
    element: HTMLElement;
    components: WeakMap<HTMLElement, AitsElement>;
    controller?: string;
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
        this.stateBindings = new Map();
        
        // 레이아웃 컨테이너 초기화
        this.containers = this._initializeContainers();
        
        // 기본 컴포넌트 등록
        this._registerDefaultComponents();
    }
    
    /**
     * 컴포넌트 클래스를 등록합니다.
     */
    public register(isValue: string, componentClass: ComponentConstructor): void {
        this.componentRegistry.set(isValue, componentClass);
    }
    
    /**
     * HTML 텍스트를 DOM으로 변환합니다.
     * Web Component를 활성화하지만 DOM에 추가하지는 않습니다.
     */
    public render(html: string): HTMLElement {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const fragment = template.content;
        
        // Web Component 활성화
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
     * 레이아웃을 구성하고 뷰를 렌더링합니다.
     * Context와 Scenario의 지시에 따라 자동으로 처리됩니다.
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
     * 특정 뷰를 상태 변경에 따라 재렌더링합니다.
     */
    public async rerender(
        element: HTMLElement,
        template: string,
        newState: any
    ): Promise<void> {
        // 템플릿과 새 상태를 결합
        const html = this._interpolateTemplate(template, newState);
        
        // 새 요소 생성
        const newElement = this.render(html);
        
        // 기존 요소의 속성 복사
        Array.from(element.attributes).forEach(attr => {
            if (attr.name !== 'id') {  // ID는 중복 방지
                newElement.setAttribute(attr.name, attr.value);
            }
        });
        
        // DOM에서 교체
        element.parentNode?.replaceChild(newElement, element);
        
        // 바인딩 정보 업데이트
        this._updateBindings(element, newElement);
    }
    
    /**
     * 상태 키와 뷰를 바인딩합니다.
     * Context가 state 변경을 감지하면 이 메서드를 통해 등록된 뷰를 재렌더링합니다.
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
     * Context에서 호출됩니다.
     */
    public async updateBoundViews(stateKey: string, newValue: any, context: Context): Promise<void> {
        const bindings = this.stateBindings.get(stateKey);
        if (!bindings) return;
        
        for (const binding of bindings) {
            // 뷰가 아직 DOM에 있는지 확인
            if (document.body.contains(binding.view.element)) {
                await this.rerender(
                    binding.view.element,
                    binding.template,
                    { [stateKey]: newValue, ...context.state }
                );
            } else {
                // DOM에서 제거된 뷰는 바인딩에서도 제거
                bindings.delete(binding);
            }
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
    
    /**
     * 특정 셀렉터로 관리 중인 컴포넌트를 찾습니다.
     */
    public queryComponent<T extends AitsElement>(selector: string): T | undefined {
        const element = document.querySelector(selector) as HTMLElement | null;
        if (!element) return undefined;
        
        // 현재 레이아웃의 모든 뷰에서 컴포넌트 검색
        for (const section of Object.values(this.currentLayout)) {
            if (section && section.components.has(element)) {
                return section.components.get(element) as T;
            }
        }
        
        return undefined;
    }
    
    /**
     * 현재 레이아웃을 정리합니다.
     */
    public clearLayout(): void {
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
        // 루트 컨테이너 찾기 또는 생성
        let root = document.getElementById('aits-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'aits-root';
            root.className = 'aits-layout';
            document.body.appendChild(root);
        }
        
        // 메인 컨테이너 생성
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
     * 기본 컴포넌트를 등록합니다.
     */
    private _registerDefaultComponents(): void {
        // components 폴더의 컴포넌트들을 자동으로 등록
        // 실제 구현에서는 import를 통해 등록
        // this.register('aits-list', AitsList);
        // this.register('aits-article', AitsArticle);
        // ...
    }
    
    /**
     * Fragment 내의 Web Component를 활성화합니다.
     */
    private _activateComponents(fragment: DocumentFragment): WeakMap<HTMLElement, AitsElement> {
        const components = new WeakMap<HTMLElement, AitsElement>();
        const elements = fragment.querySelectorAll('[is^="aits-"]');
        
        elements.forEach(element => {
            const htmlElement = element as HTMLElement;
            const isValue = htmlElement.getAttribute('is');
            
            if (isValue && this.componentRegistry.has(isValue)) {
                const ComponentClass = this.componentRegistry.get(isValue)!;
                const instance = new ComponentClass();
                
                // 속성 복사
                Array.from(htmlElement.attributes).forEach(attr => {
                    if (attr.name !== 'is') {
                        instance.setAttribute(attr.name, attr.value);
                    }
                });
                
                // 자식 노드 이동
                while (htmlElement.firstChild) {
                    instance.appendChild(htmlElement.firstChild);
                }
                
                // DOM에서 교체
                htmlElement.parentNode?.replaceChild(instance, htmlElement);
                
                // 컴포넌트 맵에 저장
                components.set(instance, instance);
            }
        });
        
        return components;
    }
    
    /**
     * 레이아웃 섹션을 렌더링합니다.
     */
    private async _renderLayoutSection(
        section: 'header' | 'footer' | 'aside',
        templatePath: string,
        context: Context
    ): Promise<void> {
        // HTML 로드
        const html = await this.aits.html(templatePath);
        
        // 템플릿과 상태 결합
        const interpolated = this._interpolateTemplate(html, context.state);
        
        // DOM 생성
        const element = this.render(interpolated);
        
        // 컨테이너 찾기 또는 생성
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
        
        // 기존 콘텐츠 제거
        if (this.currentLayout[section]) {
            this.currentLayout[section]!.element.remove();
        }
        
        // 새 콘텐츠 추가
        this.containers[section]!.appendChild(element);
        
        // 레이아웃 정보 저장
        this.currentLayout[section] = {
            element,
            components: new WeakMap(),
            template: html
        };
    }
    
    /**
     * 메인 콘텐츠를 렌더링합니다. (전환 효과 포함)
     */
    private async _renderMainContent(
        viewPaths: string[],
        context: Context,
        options?: TransitionOptions
    ): Promise<void> {
        // 다중 뷰를 위한 컨테이너 생성
        const container = document.createElement('div');
        container.className = 'aits-main-content';
        
        // 각 뷰 로드 및 렌더링
        const loadPromises = viewPaths.map(async (path) => {
            const html = await this.aits.html(path, {
                onProgress: (progress) => this.updateLoadingProgress(progress)
            });
            const interpolated = this._interpolateTemplate(html, context.state);
            return this.render(interpolated);
        });
        
        const elements = await Promise.all(loadPromises);
        elements.forEach(el => container.appendChild(el));
        
        // 전환 효과 실행
        const oldMain = this.currentLayout.main?.element || null;
        
        if (this.activeTransition) {
            await this.activeTransition.execute(
                oldMain,
                container,
                this.containers.main,
                options
            );
        } else {
            // 전환 효과 없이 즉시 교체
            if (oldMain) oldMain.remove();
            this.containers.main.appendChild(container);
        }
        
        // 레이아웃 정보 업데이트
        this.currentLayout.main = {
            element: container,
            components: new WeakMap(),
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
        // 모달 컨테이너 찾기 또는 생성
        if (!this.containers.modal) {
            const modalContainer = document.createElement('div');
            modalContainer.id = 'aits-modal';
            modalContainer.className = 'aits-modal-container';
            modalContainer.dataset.aitsModal = 'true';
            document.body.appendChild(modalContainer);
            this.containers.modal = modalContainer;
        }
        
        // HTML 로드 및 렌더링
        const html = await this.aits.html(modalPath);
        const interpolated = this._interpolateTemplate(html, context.state);
        const element = this.render(interpolated);
        
        // 기존 모달 제거
        if (this.currentLayout.modal) {
            this.currentLayout.modal.element.remove();
        }
        
        // 새 모달 추가
        this.containers.modal.appendChild(element);
        this.containers.modal.classList.add('active');
        
        // 레이아웃 정보 저장
        this.currentLayout.modal = {
            element,
            components: new WeakMap(),
            template: html
        };
        
        // 백드롭 클릭 시 모달 닫기
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
        // 기존 요소와 관련된 모든 바인딩을 새 요소로 업데이트
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