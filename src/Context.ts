/**
 * =================================================================
 * Context.ts - 컨트롤러를 위한 만능 도구 상자
 * =================================================================
 * @description
 * - 컨트롤러의 메소드가 실행될 때 주입되는 객체입니다.
 * - 라우팅 정보, 반응형 상태 관리, 리소스 로더 접근 등
 * 페이지 제어에 필요한 모든 것을 제공합니다.
 * - AI가 가장 쉽게 상태를 관리하고 UI를 업데이트할 수 있도록
 * '반응형 상태(Reactive State)' 기능을 핵심으로 합니다.
 */
import type { Aits } from './Aits';

// Navigo의 match 객체에서 필요한 정보만 추출하여 타입을 정의
export interface RouteInfo {
    url: string;            // 매칭된 전체 URL (e.g., '/articles/123?sort=desc')
    path: string;           // 파라미터가 적용된 경로 (e.g., '/articles/123')
    route: string;          // 등록된 원본 경로 (e.g., '/articles/:id')
    params: Record<string, string> | null; // URL 파라미터 (e.g., { id: '123' })
    query: Record<string, string>;         // 쿼리 스트링 (e.g., { sort: 'desc' })
}

export class Context {
    public readonly aits: Aits;
    public readonly route: RouteInfo;
    public state: any; // 반응형 상태 객체

    private stateBindings: Map<string, Array<{element: HTMLElement, property: string}>>;

    constructor(aitsInstance: Aits, navigoMatch: any = {}) {
        this.aits = aitsInstance;

        // Navigo의 match 객체를 AI가 사용하기 쉬운 RouteInfo 형태로 가공
        const urlParams = new URLSearchParams(navigoMatch.queryString || '');
        this.route = {
            url: navigoMatch.url || '',
            path: navigoMatch.route.path,
            route: navigoMatch.route.name,
            params: navigoMatch.data || null,
            query: Object.fromEntries(urlParams.entries()),
        };

        this.stateBindings = new Map();

        // --- 반응형 상태(Reactive State)의 핵심 ---
        // state 객체를 Proxy로 감싸서, 프로퍼티 변경을 감지합니다.
        this.state = new Proxy({}, {
            set: (target: any, property: string, value: any): boolean => {
                target[property] = value;
                // 상태가 변경되면, 이 상태와 바인딩된 모든 UI를 자동으로 업데이트
                this.updateBoundElements(property);
                return true;
            }
        });
    }

    /**
     * 상태(state)의 특정 키(key)와 UI 요소(element)의 속성(property)을 연결합니다.
     * 예: ctx.bind('article.title', document.getElementById('title'), 'textContent');
     * 이후 ctx.state.article = { title: '새 제목' }으로 변경하면,
     * 해당 요소의 textContent가 '새 제목'으로 자동 업데이트됩니다.
     * @param stateKey - 추적할 상태의 키
     * @param element - 업데이트할 UI 요소
     * @param property - 업데이트할 요소의 속성 (e.g., 'textContent', 'value', 'src')
     */
    public bind(stateKey: string, element: HTMLElement, property: string): void {
        if (!this.stateBindings.has(stateKey)) {
            this.stateBindings.set(stateKey, []);
        }
        this.stateBindings.get(stateKey)!.push({ element, property });
    }

    /**
     * 특정 상태 키와 연결된 모든 UI 요소를 업데이트합니다.
     * @param propertyKey - 변경된 상태의 키
     */
    private updateBoundElements(propertyKey: string): void {
        const bindings = this.stateBindings.get(propertyKey);
        if (bindings) {
            const value = this.state[propertyKey];
            bindings.forEach(binding => {
                try {
                    (binding.element as any)[binding.property] = value;
                } catch (e) {
                    console.error(`[Aits] Error updating bound element for state '${propertyKey}':`, e);
                }
            });
        }
    }

    /**
     * 페이지를 이동합니다.
     * @param url - 이동할 내부 경로
     */
    public navigate(url: string): void {
        this.aits.navigate(url);
    }

    /**
     * 외부 URL로 리다이렉트하거나 페이지를 새로고침합니다.
     * @param url - 이동할 전체 URL
     * @param replace - History에 남기지 않을지 여부 (기본값: false)
     */
    public redirect(url: string, replace = false): void {
        replace ? window.location.replace(url) : window.location.assign(url);
    }

    // --- Loader 프록시 메소드 ---
    public header(src: string, onLoad?: (el: HTMLElement) => void) {
        return this.aits.header(src, onLoad);
    }
    
    public footer(src: string, onLoad?: (el: HTMLElement) => void) {
        return this.aits.footer(src, onLoad);
    }

    public view(src: string, onLoad?: (el: HTMLElement) => void) {
        return this.aits.view(src, onLoad);
    }
    
    public json(src: string) {
        return this.aits.json(src);
    }
    
    public js(src: string) {
        return this.aits.js(src);
    }
    
    public css(src: string) {
        return this.aits.css(src);
    }
}