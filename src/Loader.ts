/**
 * =================================================================
 * Loader.ts - 순수 리소스 관리자 (Pure Resource Manager)
 * =================================================================
 * @description
 * - HTML, JSON, JS, CSS 등 모든 외부 리소스의 로딩과 캐싱만을 전담합니다.
 * - DOM 조작에 일체 관여하지 않으며, 순수한 데이터(문자열, 객체)만 반환합니다.
 * - 진행률 추적 시스템을 제공하여 Transition과 동기화할 수 있습니다.
 * - 지능적인 캐싱과 메모리 관리를 통해 애플리케이션 성능을 최적화합니다.
 * @author Aits Framework AI
 * @version 0.2.0
 */

import type { Aits } from './Aits';

// 로딩 진행률을 추적하기 위한 인터페이스
export interface LoadingProgress {
    loaded: number;      // 로드된 바이트 수
    total: number;       // 전체 바이트 수
    progress: number;    // 0~1 사이의 진행률
    resource: string;    // 리소스 식별자
}

// 리소스 로딩 옵션
export interface LoadOptions {
    cache?: boolean;                                    // 캐싱 여부 (기본: true)
    priority?: 'high' | 'normal' | 'low';              // 로딩 우선순위
    onProgress?: (progress: LoadingProgress) => void;   // 진행률 콜백
    signal?: AbortSignal;                               // 취소 신호
}

// 캐시 엔트리 타입
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    size: number;
    usage: number;  // 사용 횟수
}

// 병렬 로딩을 위한 배치 로딩 결과
export interface BatchLoadResult<T> {
    results: Map<string, T>;
    errors: Map<string, Error>;
    totalProgress: LoadingProgress;
}

export class Loader {
    private aits: Aits;
    
    // 타입별 캐시 저장소
    private htmlCache: Map<string, CacheEntry<string>>;
    private jsonCache: Map<string, CacheEntry<any>>;
    private scriptCache: Set<string>;  // 스크립트는 중복 로드 방지만 체크
    private styleCache: Set<string>;   // 스타일시트도 중복 로드 방지만 체크
    
    // 진행 중인 요청 추적 (중복 요청 방지)
    private pendingRequests: Map<string, Promise<any>>;
    
    // 메모리 관리 설정
    private readonly MAX_CACHE_SIZE: number = 10 * 1024 * 1024; // 10MB
    private readonly MAX_CACHE_AGE: number = 5 * 60 * 1000;     // 5분
    private currentCacheSize: number = 0;
    
    // 진행률 추적을 위한 전역 리스너
    private globalProgressListeners: Set<(progress: LoadingProgress) => void>;

    public constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
        this.htmlCache = new Map();
        this.jsonCache = new Map();
        this.scriptCache = new Set();
        this.styleCache = new Set();
        this.pendingRequests = new Map();
        this.globalProgressListeners = new Set();
        
        // 주기적인 캐시 정리
        this._startCacheCleanup();
    }

    /**
     * HTML 리소스를 로드합니다.
     * @param src - HTML 파일의 경로
     * @param options - 로딩 옵션
     * @returns 순수한 HTML 문자열
     */
    public async html(src: string, options: LoadOptions = {}): Promise<string> {
        const cacheKey = `html:${src}`;
        
        // 캐시 확인
        if (options.cache !== false) {
            const cached = this._getCached(this.htmlCache, src);
            if (cached) return cached;
        }
        
        // 중복 요청 방지
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }
        
        // 새로운 요청
        const request = this._fetchWithProgress(src, 'text', options)
            .then(html => {
                if (options.cache !== false) {
                    this._setCached(this.htmlCache, src, html);
                }
                return html;
            })
            .finally(() => {
                this.pendingRequests.delete(cacheKey);
            });
        
        this.pendingRequests.set(cacheKey, request);
        return request;
    }

    /**
     * JSON 데이터를 로드합니다.
     * @param src - JSON 파일의 경로
     * @param options - 로딩 옵션
     * @returns 파싱된 JSON 객체
     */
    public async json<T = any>(src: string, options: LoadOptions = {}): Promise<T> {
        const cacheKey = `json:${src}`;
        
        // 캐시 확인
        if (options.cache !== false) {
            const cached = this._getCached(this.jsonCache, src);
            if (cached) return cached;
        }
        
        // 중복 요청 방지
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }
        
        // 새로운 요청
        const request = this._fetchWithProgress(src, 'json', options)
            .then(data => {
                if (options.cache !== false) {
                    this._setCached(this.jsonCache, src, data);
                }
                return data;
            })
            .finally(() => {
                this.pendingRequests.delete(cacheKey);
            });
        
        this.pendingRequests.set(cacheKey, request);
        return request;
    }

    /**
     * JavaScript 파일을 로드합니다.
     * @param src - JS 파일의 경로
     * @param options - 로딩 옵션
     */
    public async script(src: string, options: LoadOptions = {}): Promise<void> {
        const url = this._toAbsoluteUrl(src);
        
        // 이미 로드된 스크립트 체크
        if (this.scriptCache.has(url)) {
            options.onProgress?.({ loaded: 1, total: 1, progress: 1, resource: src });
            return;
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            
            // 우선순위 설정
            if (options.priority === 'high') {
                script.fetchPriority = 'high';
            } else if (options.priority === 'low') {
                script.fetchPriority = 'low';
            }
            
            // 취소 처리
            if (options.signal) {
                options.signal.addEventListener('abort', () => {
                    script.remove();
                    reject(new Error(`Script loading aborted: ${src}`));
                });
            }
            
            script.onload = () => {
                this.scriptCache.add(url);
                options.onProgress?.({ loaded: 1, total: 1, progress: 1, resource: src });
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * CSS 파일을 로드합니다.
     * @param src - CSS 파일의 경로
     * @param options - 로딩 옵션
     */
    public async style(src: string, options: LoadOptions = {}): Promise<void> {
        const url = this._toAbsoluteUrl(src);
        
        // 이미 로드된 스타일시트 체크
        if (this.styleCache.has(url)) {
            options.onProgress?.({ loaded: 1, total: 1, progress: 1, resource: src });
            return;
        }
        
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            
            // 우선순위 설정
            if (options.priority === 'high') {
                link.fetchPriority = 'high';
            } else if (options.priority === 'low') {
                link.fetchPriority = 'low';
            }
            
            // 취소 처리
            if (options.signal) {
                options.signal.addEventListener('abort', () => {
                    link.remove();
                    reject(new Error(`Style loading aborted: ${src}`));
                });
            }
            
            link.onload = () => {
                this.styleCache.add(url);
                options.onProgress?.({ loaded: 1, total: 1, progress: 1, resource: src });
                resolve();
            };
            
            link.onerror = () => {
                reject(new Error(`Failed to load stylesheet: ${src}`));
            };
            
            document.head.appendChild(link);
        });
    }

    /**
     * 여러 리소스를 병렬로 로드합니다.
     * @param resources - 로드할 리소스 목록
     * @param onProgress - 전체 진행률 콜백
     * @returns 배치 로딩 결과
     */
    public async batch<T = any>(
        resources: Array<{ src: string; type: 'html' | 'json' | 'script' | 'style'; options?: LoadOptions }>,
        onProgress?: (progress: LoadingProgress) => void
    ): Promise<BatchLoadResult<T>> {
        const results = new Map<string, T>();
        const errors = new Map<string, Error>();
        const progressMap = new Map<string, number>();
        
        // 각 리소스의 진행률 추적
        const updateTotalProgress = () => {
            const values = Array.from(progressMap.values());
            const totalProgress = values.reduce((sum, p) => sum + p, 0) / resources.length;
            
            onProgress?.({
                loaded: totalProgress,
                total: 1,
                progress: totalProgress,
                resource: 'batch'
            });
        };
        
        // 모든 리소스를 병렬로 로드
        const promises = resources.map(async ({ src, type, options = {} }) => {
            const individualOptions: LoadOptions = {
                ...options,
                onProgress: (progress) => {
                    progressMap.set(src, progress.progress);
                    updateTotalProgress();
                    options.onProgress?.(progress);
                }
            };
            
            try {
                let result: any;
                switch (type) {
                    case 'html':
                        result = await this.html(src, individualOptions);
                        break;
                    case 'json':
                        result = await this.json(src, individualOptions);
                        break;
                    case 'script':
                        await this.script(src, individualOptions);
                        result = true;
                        break;
                    case 'style':
                        await this.style(src, individualOptions);
                        result = true;
                        break;
                }
                results.set(src, result);
            } catch (error) {
                errors.set(src, error as Error);
                progressMap.set(src, 1); // 에러여도 진행률은 완료로 처리
                updateTotalProgress();
            }
        });
        
        await Promise.allSettled(promises);
        
        return {
            results,
            errors,
            totalProgress: {
                loaded: 1,
                total: 1,
                progress: 1,
                resource: 'batch'
            }
        };
    }

    /**
     * 리소스 프리로딩을 수행합니다. (렌더링을 블로킹하지 않음)
     * @param resources - 프리로드할 리소스 목록
     */
    public preload(resources: Array<{ src: string; type: 'html' | 'json' | 'script' | 'style' }>): void {
        resources.forEach(({ src, type }) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = this._toAbsoluteUrl(src);
            
            // 리소스 타입에 따른 as 속성 설정
            switch (type) {
                case 'script':
                    link.as = 'script';
                    break;
                case 'style':
                    link.as = 'style';
                    break;
                default:
                    link.as = 'fetch';
                    link.crossOrigin = 'anonymous';
            }
            
            document.head.appendChild(link);
        });
    }

    /**
     * 전역 진행률 리스너를 등록합니다.
     * @param listener - 진행률 콜백 함수
     */
    public addGlobalProgressListener(listener: (progress: LoadingProgress) => void): void {
        this.globalProgressListeners.add(listener);
    }

    /**
     * 전역 진행률 리스너를 제거합니다.
     * @param listener - 제거할 콜백 함수
     */
    public removeGlobalProgressListener(listener: (progress: LoadingProgress) => void): void {
        this.globalProgressListeners.delete(listener);
    }

    /**
     * 캐시를 수동으로 정리합니다.
     * @param maxAge - 이 시간(ms)보다 오래된 캐시 항목 제거
     */
    public clearCache(maxAge?: number): void {
        const now = Date.now();
        const threshold = maxAge || 0;
        
        // HTML 캐시 정리
        for (const [key, entry] of this.htmlCache.entries()) {
            if (now - entry.timestamp > threshold) {
                this.currentCacheSize -= entry.size;
                this.htmlCache.delete(key);
            }
        }
        
        // JSON 캐시 정리
        for (const [key, entry] of this.jsonCache.entries()) {
            if (now - entry.timestamp > threshold) {
                this.currentCacheSize -= entry.size;
                this.jsonCache.delete(key);
            }
        }
        
        console.log(`[Aits Loader] Cache cleared. Current size: ${this._formatBytes(this.currentCacheSize)}`);
    }

    /**
     * 특정 리소스의 캐시를 무효화합니다.
     * @param src - 리소스 경로
     */
    public invalidate(src: string): void {
        // HTML 캐시에서 제거
        const htmlEntry = this.htmlCache.get(src);
        if (htmlEntry) {
            this.currentCacheSize -= htmlEntry.size;
            this.htmlCache.delete(src);
        }
        
        // JSON 캐시에서 제거
        const jsonEntry = this.jsonCache.get(src);
        if (jsonEntry) {
            this.currentCacheSize -= jsonEntry.size;
            this.jsonCache.delete(src);
        }
    }

    /**
     * 현재 캐시 상태를 반환합니다.
     */
    public getCacheStats(): {
        size: number;
        htmlEntries: number;
        jsonEntries: number;
        scriptEntries: number;
        styleEntries: number;
    } {
        return {
            size: this.currentCacheSize,
            htmlEntries: this.htmlCache.size,
            jsonEntries: this.jsonCache.size,
            scriptEntries: this.scriptCache.size,
            styleEntries: this.styleCache.size
        };
    }

    // === Private Helper Methods ===

    /**
     * fetch API를 사용하여 리소스를 로드하고 진행률을 추적합니다.
     */
    private async _fetchWithProgress(
        src: string,
        responseType: 'text' | 'json',
        options: LoadOptions
    ): Promise<any> {
        const url = this._toAbsoluteUrl(src);
        
        try {
            const response = await fetch(url, {
                signal: options.signal,
                priority: options.priority as RequestPriority
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Content-Length 헤더 확인
            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            
            // 진행률 추적이 필요한 경우
            if (options.onProgress && total > 0 && response.body) {
                const reader = response.body.getReader();
                const chunks: Uint8Array[] = [];
                let loaded = 0;
                
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) break;
                    
                    chunks.push(value);
                    loaded += value.length;
                    
                    const progress: LoadingProgress = {
                        loaded,
                        total,
                        progress: loaded / total,
                        resource: src
                    };
                    
                    // 개별 리스너와 전역 리스너 모두 호출
                    options.onProgress(progress);
                    this._notifyGlobalListeners(progress);
                }
                
                // 청크들을 합쳐서 최종 데이터 생성
                const concatenated = new Uint8Array(loaded);
                let position = 0;
                for (const chunk of chunks) {
                    concatenated.set(chunk, position);
                    position += chunk.length;
                }
                
                const text = new TextDecoder().decode(concatenated);
                return responseType === 'json' ? JSON.parse(text) : text;
                
            } else {
                // 진행률 추적이 필요없는 경우 단순 처리
                const result = responseType === 'json' 
                    ? await response.json() 
                    : await response.text();
                
                if (options.onProgress) {
                    const progress: LoadingProgress = {
                        loaded: 1,
                        total: 1,
                        progress: 1,
                        resource: src
                    };
                    options.onProgress(progress);
                    this._notifyGlobalListeners(progress);
                }
                
                return result;
            }
            
        } catch (error) {
            console.error(`[Aits Loader] Failed to fetch ${src}:`, error);
            throw error;
        }
    }

    /**
     * 캐시에서 데이터를 가져옵니다.
     */
    private _getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
        const entry = cache.get(key);
        
        if (!entry) return null;
        
        // 캐시 만료 확인
        if (Date.now() - entry.timestamp > this.MAX_CACHE_AGE) {
            this.currentCacheSize -= entry.size;
            cache.delete(key);
            return null;
        }
        
        // 사용 횟수 증가
        entry.usage++;
        
        return entry.data;
    }

    /**
     * 캐시에 데이터를 저장합니다.
     */
    private _setCached<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
        const size = this._estimateSize(data);
        
        // 캐시 크기 제한 확인
        if (this.currentCacheSize + size > this.MAX_CACHE_SIZE) {
            this._evictLRU();
        }
        
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            size,
            usage: 0
        };
        
        // 기존 엔트리가 있다면 크기 차감
        const existing = cache.get(key);
        if (existing) {
            this.currentCacheSize -= existing.size;
        }
        
        cache.set(key, entry);
        this.currentCacheSize += size;
    }

    /**
     * LRU(Least Recently Used) 정책으로 캐시를 정리합니다.
     */
    private _evictLRU(): void {
        const allEntries: Array<[string, CacheEntry<any>, Map<string, CacheEntry<any>>]> = [];
        
        // 모든 캐시 엔트리 수집
        for (const [key, entry] of this.htmlCache.entries()) {
            allEntries.push([key, entry, this.htmlCache]);
        }
        for (const [key, entry] of this.jsonCache.entries()) {
            allEntries.push([key, entry, this.jsonCache]);
        }
        
        // 사용 횟수와 타임스탬프로 정렬
        allEntries.sort((a, b) => {
            const scoreA = a[1].usage + (Date.now() - a[1].timestamp) / 1000;
            const scoreB = b[1].usage + (Date.now() - b[1].timestamp) / 1000;
            return scoreA - scoreB;
        });
        
        // 캐시 크기의 20%를 정리
        const targetSize = this.MAX_CACHE_SIZE * 0.8;
        while (this.currentCacheSize > targetSize && allEntries.length > 0) {
            const [key, entry, cache] = allEntries.shift()!;
            this.currentCacheSize -= entry.size;
            cache.delete(key);
        }
    }

    /**
     * 데이터의 대략적인 크기를 추정합니다.
     */
    private _estimateSize(data: any): number {
        if (typeof data === 'string') {
            return data.length * 2; // UTF-16 기준
        } else if (typeof data === 'object') {
            return JSON.stringify(data).length * 2;
        }
        return 0;
    }

    /**
     * 상대 경로를 절대 URL로 변환합니다.
     */
    private _toAbsoluteUrl(src: string): string {
        return new URL(src, window.location.href).href;
    }

    /**
     * 바이트를 읽기 쉬운 형식으로 변환합니다.
     */
    private _formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * 전역 진행률 리스너들에게 알립니다.
     */
    private _notifyGlobalListeners(progress: LoadingProgress): void {
        this.globalProgressListeners.forEach(listener => listener(progress));
    }

    /**
     * 주기적인 캐시 정리를 시작합니다.
     */
    private _startCacheCleanup(): void {
        setInterval(() => {
            this.clearCache(this.MAX_CACHE_AGE);
        }, 60 * 1000); // 1분마다 실행
    }
}