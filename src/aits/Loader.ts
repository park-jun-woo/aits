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
type ViewCacheEntry = {
    promise: Promise<HTMLElement>;
};

export class Loader {
    private aits: Aits;
    private viewCache: Map<string, ViewCacheEntry>;
    private modelCache: Map<string, Promise<any>>;
    private viewUsage: Map<string, number>; // 뷰의 마지막 사용 시간을 기록 (for LRU)
    private readonly MAX_VIEWS_IN_CACHE: number = 10; // 메모리에 유지할 최대 뷰 개수

    public constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
        this.viewCache = new Map();
        this.modelCache = new Map();
        this.viewUsage = new Map();
    }

    /**
     * HTML 뷰 파일을 로드하여 DOM에 추가하고, 캐싱합니다.
     * @param src - 로드할 HTML 파일의 경로
     * @param onLoad - 뷰가 DOM에 추가된 후 실행될 콜백 함수
     * @returns 뷰의 HTMLElement를 resolve하는 Promise
     */
    public async view(src: string, onLoad?: (el: HTMLElement) => void): Promise<HTMLElement> {
        const cacheKey = `view:${src}`;
        
        // 1. 캐시 확인: 이미 로드된 뷰가 있다면 캐시에서 반환
        if (this.viewCache.has(cacheKey)) {
            const entry = this.viewCache.get(cacheKey)!;
            this.viewUsage.set(cacheKey, Date.now()); // 사용 시간 갱신
            return entry.promise;
        }

        // 2. 캐시 없음: 새로운 뷰 로드
        const promise = this._fetchHtml(src)
            .then(html => {
                // <main> 요소가 없으면 생성
                let main = document.body.querySelector('main');
                if (!main) {
                    main = document.createElement('main');
                    document.body.appendChild(main);
                }
                
                // HTML 문자열을 실제 HTMLElement로 변환하여 main에 추가
                const element = this._createElementFromHtml(html);
                element.dataset.viewSrc = src; // 디버깅을 위해 소스 경로 저장
                element.hidden = true; // 기본적으로 숨김 처리
                main.appendChild(element);

                onLoad?.(element); // 로드 완료 후 콜백 실행
                this.aits.updatePageLinks(); // 새로운 링크가 추가되었을 수 있으므로 갱신
                return element;
            })
            .catch(err => {
                // 로딩 실패 시 캐시에서 해당 키를 삭제
                this.viewCache.delete(cacheKey);
                this.viewUsage.delete(cacheKey);
                throw err; // 에러를 다시 던져서 호출한 쪽에서 처리할 수 있도록 함
            });

        // 3. 캐시에 새로운 뷰의 Promise를 저장하고, 메모리 관리 실행
        this._cacheView(cacheKey, { promise });
        return promise;
    }

    /**
     * JavaScript 모듈(Model)을 동적으로 import하고, 인스턴스화하여 캐싱합니다.
     * @param src - 로드할 JS 모듈 파일의 경로
     * @returns 모듈의 기본 export(주로 클래스 인스턴스)를 resolve하는 Promise
     */
    public async model(src: string): Promise<any> {
        const cacheKey = `model:${src}`;

        // 1. 캐시 확인
        if (this.modelCache.has(cacheKey)) {
            return this.modelCache.get(cacheKey)!;
        }

        // 2. 캐시 없음: 새로운 모듈 import
        const promise = import(this._toAbsoluteUrl(src))
            .then(module => {
                const Exported = module.default ?? module;
                // export된 것이 클래스(함수)이면 new로 인스턴스화, 아니면 그대로 사용
                try {
                    return typeof Exported === 'function' ? new Exported(this.aits) : Exported;
                } catch {
                    return Exported;
                }
            })
            .catch(err => {
                this.modelCache.delete(cacheKey);
                throw err;
            });
        
        // 3. 캐시에 Promise 저장
        this.modelCache.set(cacheKey, promise);
        return promise;
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

    // --- Private Helper Methods ---

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
    private _cacheView(key: string, entry: ViewCacheEntry): void {
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
