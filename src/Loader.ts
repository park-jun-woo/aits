/**
 * =================================================================
 * Loader.ts - 지능적인 리소스 관리자
 * =================================================================
 * @description
 * - HTML(view), JS(model), CSS, JSON 등 모든 외부 리소스의 로딩을 전담합니다.
 * - 지능적인 캐싱과 자동 메모리 관리를 통해 애플리케이션의 성능을 최적화합니다.
 * - 모든 리소스 로딩은 Promise 기반으로 동작하여 비동기 처리를 보장합니다.
 * @author Aits Framework AI (by parkjunwoo)
 * @version 0.1.0
 */
import type { Aits } from './Aits';

// 로드된 View를 캐싱하기 위한 타입 정의
type CacheEntry = {
    promise: Promise<HTMLElement>;
};

export class Loader {
    private aits: Aits;
    private promiseCache: Map<string, CacheEntry>;
    private templateCache: Map<string, string>;
    private viewUsage: Map<string, number>; // 뷰의 마지막 사용 시간을 기록 (for LRU)
    private readonly MAX_VIEWS_IN_CACHE: number = 10; // 메모리에 유지할 최대 뷰 개수

    public constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
        this.promiseCache = new Map();
        this.templateCache = new Map();
        this.viewUsage = new Map();
    }

    /**
     * ViewManager나 Controller가 원본 HTML 템플릿을 가져가기 위한 핵심 메서드.
     * @param src - 가져올 HTML 파일의 경로
     * @returns 원본 HTML 텍스트 또는 undefined
     */
    public async getView(src: string): Promise<string | undefined> {
        if (this.templateCache.has(src)) {
            return this.templateCache.get(src);
        }
        // 캐시에 없으면 fetch 후 저장
        const html = await this._fetchHtml(src);
        this.templateCache.set(src, html);
        return html;
    }

    /**
     * Header HTML을 로드하고 렌더링된 HTMLElement의 Promise를 반환합니다.
     */
    public async header(src: string): Promise<HTMLElement> {
        const cacheKey = `header:${src}`;
        if (this.promiseCache.has(cacheKey)) {
            return this.promiseCache.get(cacheKey)!.promise;
        }

        const promise = this.getView(src)
            .then(html => {
                if (!html) throw new Error(`Header HTML not found at: ${src}`);
                // 렌더링 책임을 ViewManager에게 위임하여 메모리상에 Element 생성
                return this.aits.render(html);
            })
            .catch(err => {
                this.promiseCache.delete(cacheKey);
                throw err;
            });
        
        this.promiseCache.set(cacheKey, { promise });
        return promise;
    }

    /**
     * Footer HTML을 로드하고 렌더링된 HTMLElement의 Promise를 반환합니다.
     */
    public async footer(src: string): Promise<HTMLElement> {
        const cacheKey = `footer:${src}`;
        if (this.promiseCache.has(cacheKey)) {
            return this.promiseCache.get(cacheKey)!.promise;
        }

        const promise = this.getView(src)
            .then(html => {
                if (!html) throw new Error(`Footer HTML not found at: ${src}`);
                return this.aits.render(html);
            })
            .catch(err => {
                this.promiseCache.delete(cacheKey);
                throw err;
            });

        this.promiseCache.set(cacheKey, { promise });
        return promise;
    }

    /**
     * View HTML을 로드하고 렌더링된 HTMLElement의 Promise를 반환합니다.
     */
    public async view(src: string): Promise<HTMLElement> {
        const cacheKey = `view:${src}`;
        if (this.promiseCache.has(cacheKey)) {
            this.viewUsage.set(cacheKey, Date.now());
            return this.promiseCache.get(cacheKey)!.promise;
        }

        const promise = this.getView(src)
            .then(html => {
                if (!html) throw new Error(`View HTML not found at: ${src}`);
                const element = this.aits.render(html);
                element.dataset.viewSrc = src; // 디버깅용 정보는 유지
                element.hidden = true;         // 화면 전환 효과를 위해 기본 숨김
                return element;
            })
            .catch(err => {
                this.promiseCache.delete(cacheKey);
                this.viewUsage.delete(cacheKey);
                throw err;
            });

        this._cacheView(cacheKey, { promise });
        return promise;
    }

    /**
     * JSON 파일을 fetch API로 로드하여 파싱합니다.
     * @param src - 로드할 JSON 파일의 경로
     */
    public async json(src: string): Promise<any> {
        const url = this._toAbsoluteUrl(src);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch JSON: ${src} - ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * 일반 JavaScript 파일을 <script> 태그로 동적 로드합니다.
     * @param src - 로드할 JS 파일의 경로
     */
    public async js(src: string): Promise<void> {
        const url = this._toAbsoluteUrl(src);
        if (document.querySelector(`script[src="${url}"]`)) return; // 이미 로드되었으면 중복 실행 방지

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * CSS 파일을 <link> 태그로 동적 로드합니다.
     * @param src - 로드할 CSS 파일의 경로
     */
    public async css(src: string): Promise<void> {
        const url = this._toAbsoluteUrl(src);
        if (document.querySelector(`link[rel="stylesheet"][href="${url}"]`)) return;

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load css: ${src}`));
            document.head.appendChild(link);
        });
    }

    // --- Private Helper Methods ---

    /**
     * 특정 태그로 요소를 감싸는 헬퍼 메소드
     */
    private _wrapInTag(element: HTMLElement, tagName: 'header' | 'footer' | 'section'): HTMLElement {
        const wrapper = document.createElement(tagName);
        wrapper.appendChild(element);
        return wrapper;
    }

    /**
     * URL로부터 HTML 콘텐츠를 가져옵니다.
     */
    private async _fetchHtml(src: string): Promise<string> {
        const response = await fetch(src);
        if (!response.ok) {
            throw new Error(`Failed to fetch HTML: ${src} - ${response.statusText}`);
        }
        return response.text();
    }

    /**
     * HTML 문자열로부터 단일 HTMLElement를 생성합니다.
     */
    private _createElementFromHtml(html: string): HTMLElement {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild as HTMLElement;
    }

    /**
     * 뷰를 캐시에 저장하고, 캐시 크기가 최대치를 초과하면 오래된 뷰를 제거합니다.
     */
    private _cacheView(key: string, entry: CacheEntry): void {
        this.viewCache.set(key, entry);
        this.viewUsage.set(key, Date.now());
        if (this.viewCache.size > this.MAX_VIEWS_IN_CACHE) {
            this._evictOldestView();
        }
    }

    /**
     * LRU(Least Recently Used) 정책에 따라 가장 오랫동안 사용되지 않은 뷰를 캐시와 DOM에서 제거합니다.
     */
    private _evictOldestView(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        // 가장 오래된 뷰 찾기
        for (const [key, timestamp] of this.viewUsage.entries()) {
            if (timestamp < oldestTime) {
                oldestTime = timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const entry = this.viewCache.get(oldestKey);
            // DOM에서 해당 요소 제거
            entry?.promise.then(element => element?.remove());
            
            // 캐시와 사용 기록에서 삭제
            this.viewCache.delete(oldestKey);
            this.viewUsage.delete(oldestKey);
            console.log(`[Aits Loader] Evicted view from cache: ${oldestKey}`);
        }
    }

    /**
     * 상대 경로를 절대 URL 경로로 변환합니다.
     */
    private _toAbsoluteUrl(src: string): string {
        return new URL(src, window.location.href).href;
    }
}
