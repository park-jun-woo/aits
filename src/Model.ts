/**
 * =================================================================
 * Model.ts - 데이터 처리 기반 클래스 (개선된 버전)
 * =================================================================
 * @description
 * - 타입 안전성 강화
 * - 에러 처리 개선
 * - 메모리 관리 개선
 * @author Aits Framework AI
 * @version 0.4.0
 */

import type { Aits } from './Aits';
import type { IApiAdapter, AitsDataOptions } from './ApiAdapter';

// API 에러 정보
export interface ApiError {
    status: number;
    statusText: string;
    message: string;
    data?: any;
    timestamp: string;
    requestId?: string;
    code?: string;
    originalError?: Error;
}

// API 요청 옵션
export interface RequestOptions {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    mode?: RequestMode;
    credentials?: RequestCredentials;
    cache?: RequestCache;
    redirect?: RequestRedirect;
    referrer?: string;
    referrerPolicy?: ReferrerPolicy;
    integrity?: string;
    keepalive?: boolean;
    signal?: AbortSignal;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    withCredentials?: boolean;
    cacheKey?: string; // 캐시 키 커스터마이징
}

// 응답 인터셉터 타입
export type ResponseInterceptor = (response: Response) => Promise<Response>;
export type ErrorInterceptor = (error: ApiError) => Promise<any>;

// 페이지네이션 응답 타입
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// 요청 캐시 엔트리
interface RequestCacheEntry {
    data: any;
    timestamp: number;
    expiresAt: number;
}

export abstract class Model<TData = any> {
    protected aits: Aits;
    protected apiAdapter: IApiAdapter;
    
    protected abstract readonly apiPrefix: string;
    
    protected defaultOptions: RequestOptions = {
        timeout: 30000,
        retries: 0,
        retryDelay: 1000,
        withCredentials: true
    };
    
    private responseInterceptors: ResponseInterceptor[] = [];
    private errorInterceptors: ErrorInterceptor[] = [];
    private activeRequests: Map<string, AbortController> = new Map();
    
    // 요청 캐시 (옵션별로 구분)
    private requestCache: Map<string, RequestCacheEntry> = new Map();
    private readonly CACHE_TTL = 60 * 1000; // 1분
    private cacheCleanupInterval: number | null = null;

    constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
        this.apiAdapter = this.aits.apiAdapter;
        
        // 캐시 정리 시작
        this.startCacheCleanup();
    }
    
    /**
     * 캐시 정리 시작
     */
    private startCacheCleanup(): void {
        this.cacheCleanupInterval = window.setInterval(() => {
            const now = Date.now();
            const entriesToDelete: string[] = [];
            
            this.requestCache.forEach((entry, key) => {
                if (now > entry.expiresAt) {
                    entriesToDelete.push(key);
                }
            });
            
            entriesToDelete.forEach(key => this.requestCache.delete(key));
        }, 60 * 1000); // 1분마다
    }

    // === Primary Key 관련 메서드 ===

    public getPkValue(data: Record<string, any>): string | number | undefined {
        const pkField = this.apiAdapter.getPrimaryKeyField();
        return data?.[pkField];
    }

    public setPkValue(data: Record<string, any>, value: string | number): void {
        const pkField = this.apiAdapter.getPrimaryKeyField();
        data[pkField] = value;
    }

    // === 단일 데이터 CRUD 메서드 ===

    public getOne(id: string | number, params?: Record<string, any>): Promise<TData> {
        return this.get(`/${id}`, params);
    }

    public createOne(data: Partial<TData>): Promise<TData> {
        return this.post('', data);
    }

    public updateOne(id: string | number, data: Partial<TData>): Promise<TData> {
        return this.put(`/${id}`, data);
    }

    public patchOne(id: string | number, data: Partial<TData>): Promise<TData> {
        return this.patch(`/${id}`, data);
    }

    public removeOne(id: string | number): Promise<TData | void> {
        return this.delete(`/${id}`);
    }

    // === 목록 조회 메서드 ===

    public getAll(params?: Record<string, any>): Promise<TData[]> {
        return this.get('', params);
    }

    public getPaged(options: AitsDataOptions = {}): Promise<PaginatedResponse<TData>> {
        const backendParams = this.apiAdapter.transformDataOptions(options);
        return this.get('', backendParams);
    }

    public search(query: string, options: AitsDataOptions = {}): Promise<TData[]> {
        const params = this.apiAdapter.transformDataOptions({
            ...options,
            search: query
        });
        return this.get('/search', params);
    }

    // === HTTP 메서드 ===

    protected async get(path: string = '', params?: Record<string, any>): Promise<any> {
        const url = this.buildUrl(path, params);
        
        // 캐시 확인
        const cacheKey = this.getCacheKey('GET', url, params);
        const cached = this.getFromCache(cacheKey);
        if (cached !== null) {
            return cached;
        }
        
        const result = await this.request(url, { 
            method: 'GET',
            cacheKey 
        });
        
        // 캐시 저장
        this.saveToCache(cacheKey, result);
        
        return result;
    }

    protected async post(path: string = '', body?: any): Promise<any> {
        const url = this.buildUrl(path);
        return this.request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    protected async put(path: string, body: any): Promise<any> {
        const url = this.buildUrl(path);
        return this.request(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    protected async patch(path: string, body: any): Promise<any> {
        const url = this.buildUrl(path);
        return this.request(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    protected async delete(path: string, body?: any): Promise<any> {
        const url = this.buildUrl(path);
        const options: RequestOptions = {
            method: 'DELETE',
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
        };
        
        return this.request(url, options);
    }

    // === 캐시 관리 ===
    
    private getCacheKey(method: string, url: string, params?: any): string {
        return `${method}:${url}:${JSON.stringify(params || {})}`;
    }
    
    private getFromCache(key: string): any | null {
        const entry = this.requestCache.get(key);
        if (entry && Date.now() < entry.expiresAt) {
            return entry.data;
        }
        return null;
    }
    
    private saveToCache(key: string, data: any): void {
        this.requestCache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.CACHE_TTL
        });
    }
    
    public clearCache(): void {
        this.requestCache.clear();
    }

    // === 인터셉터 관리 ===

    public addResponseInterceptor(interceptor: ResponseInterceptor): void {
        this.responseInterceptors.push(interceptor);
    }

    public addErrorInterceptor(interceptor: ErrorInterceptor): void {
        this.errorInterceptors.push(interceptor);
    }

    public clearInterceptors(): void {
        this.responseInterceptors = [];
        this.errorInterceptors = [];
    }

    // === 요청 취소 관리 ===

    public cancelRequest(requestId: string): void {
        const controller = this.activeRequests.get(requestId);
        if (controller) {
            controller.abort();
            this.activeRequests.delete(requestId);
        }
    }

    public cancelAllRequests(): void {
        this.activeRequests.forEach(controller => controller.abort());
        this.activeRequests.clear();
    }

    // === Private 헬퍼 메서드 ===

    private buildUrl(path: string = '', params?: Record<string, any>): string {
        const baseUrl = new URL(this.apiPrefix + path, window.location.origin);
        
        if (params) {
            const cleanParams = Object.entries(params)
                .filter(([_, value]) => value !== null && value !== undefined)
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, any>);
            
            Object.entries(cleanParams).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => baseUrl.searchParams.append(key, String(v)));
                } else if (typeof value === 'object') {
                    baseUrl.searchParams.append(key, JSON.stringify(value));
                } else {
                    baseUrl.searchParams.append(key, String(value));
                }
            });
        }
        
        return baseUrl.toString();
    }

    /**
     * HTTP 요청 실행 (개선된 에러 처리)
     */
    private async request(url: string, options: RequestOptions): Promise<any> {
        const mergedOptions: RequestOptions = {
            ...this.defaultOptions,
            ...options,
            credentials: this.defaultOptions.withCredentials ? 'include' : 'same-origin'
        };
        
        const requestId = `${options.method}-${url}-${Date.now()}`;
        const controller = new AbortController();
        this.activeRequests.set(requestId, controller);
        
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, mergedOptions.timeout!);
        
        const fetchOptions: RequestInit = {
            method: mergedOptions.method,
            headers: mergedOptions.headers,
            body: mergedOptions.body,
            credentials: mergedOptions.credentials,
            mode: mergedOptions.mode,
            cache: mergedOptions.cache,
            redirect: mergedOptions.redirect,
            referrer: mergedOptions.referrer,
            referrerPolicy: mergedOptions.referrerPolicy,
            integrity: mergedOptions.integrity,
            keepalive: mergedOptions.keepalive,
            signal: controller.signal
        };
        
        try {
            let response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            
            // 응답 인터셉터 실행
            for (const interceptor of this.responseInterceptors) {
                response = await interceptor(response);
            }
            
            if (!response.ok) {
                const error = await this.createApiError(response);
                
                // 에러 인터셉터 실행
                for (const interceptor of this.errorInterceptors) {
                    try {
                        const result = await interceptor(error);
                        if (result !== undefined) {
                            return result;
                        }
                    } catch (e) {
                        console.error('[Model] Error in interceptor:', e);
                    }
                }
                
                throw error;
            }
            
            if (response.status === 204) {
                return null;
            }
            
            if (options.method === 'HEAD') {
                return null;
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                return await response.json();
            } else if (contentType?.includes('text/')) {
                return await response.text();
            } else {
                return await response.blob();
            }
            
        } catch (error: any) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                const timeoutError: ApiError = {
                    status: 0,
                    statusText: 'Timeout',
                    message: `Request timeout after ${mergedOptions.timeout}ms`,
                    timestamp: new Date().toISOString(),
                    requestId,
                    originalError: error
                };
                throw timeoutError;
            }
            
            // 재시도 로직
            if (mergedOptions.retries! > 0 && this.isRetryableError(error)) {
                console.log(`[Model] Retrying request (${mergedOptions.retries} attempts left)`);
                await this.delay(mergedOptions.retryDelay!);
                
                const retryOptions: RequestOptions = {
                    ...options,
                    retries: mergedOptions.retries! - 1
                };
                
                return this.request(url, retryOptions);
            }
            
            console.error('[Model] Request failed:', error);
            throw error;
        } finally {
            this.activeRequests.delete(requestId);
        }
    }

    /**
     * API 에러 객체 생성 (개선된 버전)
     */
    private async createApiError(response: Response): Promise<ApiError> {
        let data: any;
        let message: string;
        let originalError: Error | undefined;
        
        try {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const jsonData = await response.json();
                data = jsonData;
                message = jsonData?.message || jsonData?.error || response.statusText;
            } else {
                const textData = await response.text();
                message = textData || response.statusText;
            }
        } catch (e) {
            originalError = e instanceof Error ? e : new Error(String(e));
            message = `Failed to parse error response: ${originalError.message}`;
        }
        
        const error: ApiError = {
            status: response.status,
            statusText: response.statusText,
            message: message || `HTTP ${response.status} ${response.statusText}`,
            data,
            timestamp: new Date().toISOString(),
            requestId: response.headers.get('x-request-id') || undefined,
            originalError
        };
        
        return error;
    }

    private isRetryableError(error: any): boolean {
        return !error.status || (error.status >= 500 && error.status < 600);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === 유틸리티 메서드 ===

    public setDefaultOptions(options: Partial<RequestOptions>): void {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }

    public getEndpoint(path: string = ''): string {
        return this.apiPrefix + path;
    }

    public getApiAdapter(): IApiAdapter {
        return this.apiAdapter;
    }
    
    public setApiAdapter(adapter: IApiAdapter): void {
        this.apiAdapter = adapter;
    }
    
    /**
     * 정리 메서드
     */
    public destroy(): void {
        this.cancelAllRequests();
        this.clearInterceptors();
        this.clearCache();
        
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
            this.cacheCleanupInterval = null;
        }
    }
}