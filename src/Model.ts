/**
 * =================================================================
 * Model.ts - Aits 애플리케이션 데이터 처리의 기반 (개선된 버전)
 * =================================================================
 * @description
 * - 모든 데이터 모델 클래스가 상속받아야 하는 추상 클래스입니다.
 * - 타입 안전성이 강화된 API 에러 처리를 제공합니다.
 * @author Aits Framework AI
 * @version 0.3.0
 */

import type { Aits } from './Aits';
import type { IApiAdapter, AitsDataOptions } from './ApiAdapter';

// API 에러 정보 (타입 안전성 강화)
export interface ApiError<T = unknown> {
    status: number;
    statusText: string;
    message?: string;
    data?: T;
    timestamp?: string;
    requestId?: string;
    code?: string;
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
    // 커스텀 옵션
    timeout?: number;           // 요청 타임아웃 (ms)
    retries?: number;          // 재시도 횟수
    retryDelay?: number;       // 재시도 간격 (ms)
    withCredentials?: boolean; // 쿠키 포함 여부
}

// 응답 인터셉터 타입
export type ResponseInterceptor = (response: Response) => Promise<Response>;
export type ErrorInterceptor<T = unknown> = (error: ApiError<T>) => Promise<any>;

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

export abstract class Model<TData = any> {
    protected aits: Aits;
    protected apiAdapter: IApiAdapter;
    
    // 각 모델이 담당하는 API의 기본 경로
    protected abstract readonly apiPrefix: string;
    
    // 기본 요청 옵션
    protected defaultOptions: RequestOptions = {
        timeout: 30000,      // 30초
        retries: 0,          // 재시도 안함
        retryDelay: 1000,    // 1초
        withCredentials: true // 쿠키 포함
    };
    
    // 인터셉터 (타입 안전성 강화)
    private responseInterceptors: ResponseInterceptor[] = [];
    private errorInterceptors: ErrorInterceptor[] = [];
    
    // 진행 중인 요청 추적
    private activeRequests: Map<string, AbortController> = new Map();

    constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
        this.apiAdapter = this.aits.apiAdapter;
    }

    // === Primary Key 관련 메서드 ===

    /**
     * 데이터 객체에서 Primary Key 값을 가져옵니다.
     */
    public getPkValue(data: Record<string, any>): string | number | undefined {
        const pkField = this.apiAdapter.getPrimaryKeyField();
        return data?.[pkField];
    }

    /**
     * 데이터 객체에 Primary Key 값을 설정합니다.
     */
    public setPkValue(data: Record<string, any>, value: string | number): void {
        const pkField = this.apiAdapter.getPrimaryKeyField();
        data[pkField] = value;
    }

    // === 단일 데이터 CRUD 메서드 (타입 안전성 강화) ===

    /**
     * ID로 단일 데이터를 조회합니다.
     */
    public getOne(id: string | number, params?: Record<string, any>): Promise<TData> {
        return this.get<TData>(`/${id}`, params);
    }

    /**
     * 새로운 데이터를 생성합니다.
     */
    public createOne(data: Partial<TData>): Promise<TData> {
        return this.post<TData>('', data);
    }

    /**
     * 기존 데이터 전체를 수정합니다.
     */
    public updateOne(id: string | number, data: Partial<TData>): Promise<TData> {
        return this.put<TData>(`/${id}`, data);
    }

    /**
     * 특정 데이터의 일부를 수정합니다.
     */
    public patchOne(id: string | number, data: Partial<TData>): Promise<TData> {
        return this.patch<TData>(`/${id}`, data);
    }

    /**
     * 특정 데이터를 삭제합니다.
     */
    public removeOne(id: string | number): Promise<TData | void> {
        return this.delete<TData>(`/${id}`);
    }

    // === 목록 조회 메서드 ===

    /**
     * 전체 목록을 조회합니다.
     */
    public getAll(params?: Record<string, any>): Promise<TData[]> {
        return this.get<TData[]>('', params);
    }

    /**
     * 페이지네이션이 적용된 목록을 조회합니다.
     */
    public getPaged(options: AitsDataOptions = {}): Promise<PaginatedResponse<TData>> {
        const backendParams = this.apiAdapter.transformDataOptions(options);
        return this.get<PaginatedResponse<TData>>('', backendParams);
    }

    /**
     * 검색 조건으로 목록을 조회합니다.
     */
    public search(query: string, options: AitsDataOptions = {}): Promise<TData[]> {
        const params = this.apiAdapter.transformDataOptions({
            ...options,
            search: query
        });
        return this.get<TData[]>('/search', params);
    }

    /**
     * 필터 조건으로 목록을 조회합니다.
     */
    public filter(filters: Record<string, any>, options: AitsDataOptions = {}): Promise<TData[]> {
        const params = this.apiAdapter.transformDataOptions({
            ...options,
            filter: filters
        });
        return this.get<TData[]>('', params);
    }

    // === 벌크 작업 메서드 ===

    /**
     * 여러 개의 데이터를 한 번에 생성합니다.
     */
    public createMany(data: Partial<TData>[]): Promise<TData[]> {
        return this.post<TData[]>('/bulk', data);
    }

    /**
     * 여러 개의 데이터를 한 번에 수정합니다.
     */
    public updateMany(data: Array<Partial<TData> & Record<string, any>>): Promise<TData[]> {
        const pkField = this.apiAdapter.getPrimaryKeyField();
        const invalidItems = data.filter(item => !item[pkField]);
        
        if (invalidItems.length > 0) {
            throw new Error(`[Model] Missing primary key '${pkField}' in ${invalidItems.length} items`);
        }
        
        return this.put<TData[]>('/bulk', data);
    }

    /**
     * 여러 개의 데이터를 한 번에 부분 수정합니다.
     */
    public patchMany(data: Array<Partial<TData> & Record<string, any>>): Promise<TData[]> {
        const pkField = this.apiAdapter.getPrimaryKeyField();
        const invalidItems = data.filter(item => !item[pkField]);
        
        if (invalidItems.length > 0) {
            throw new Error(`[Model] Missing primary key '${pkField}' in ${invalidItems.length} items`);
        }
        
        return this.patch<TData[]>('/bulk', data);
    }

    /**
     * 여러 개의 데이터를 한 번에 삭제합니다.
     */
    public removeMany(ids: (string | number)[]): Promise<void> {
        if (ids.length === 0) {
            throw new Error('[Model] No IDs provided for bulk delete');
        }
        
        return this.delete<void>('/bulk', { ids });
    }

    // === 특수 작업 메서드 ===

    /**
     * 데이터 개수를 조회합니다.
     */
    public count(filters?: Record<string, any>): Promise<number> {
        const params = filters ? { filter: filters } : undefined;
        return this.get<{ count: number }>('/count', params)
            .then(response => response.count);
    }

    /**
     * 데이터 존재 여부를 확인합니다.
     */
    public async exists(id: string | number): Promise<boolean> {
        try {
            await this.head(`/${id}`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 중복 여부를 확인합니다.
     */
    public async checkDuplicate(field: string, value: any, excludeId?: string | number): Promise<boolean> {
        const params: Record<string, any> = { field, value };
        if (excludeId) {
            params.excludeId = excludeId;
        }
        
        const response = await this.get<{ duplicate: boolean }>('/check-duplicate', params);
        return response.duplicate;
    }

    // === HTTP 메서드 ===

    /**
     * GET 요청
     */
    protected async get<T>(path: string = '', params?: Record<string, any>): Promise<T> {
        const url = this.buildUrl(path, params);
        return this.request<T>(url, { method: 'GET' });
    }

    /**
     * POST 요청
     */
    protected async post<T>(path: string = '', body?: any): Promise<T> {
        const url = this.buildUrl(path);
        return this.request<T>(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * PUT 요청
     */
    protected async put<T>(path: string, body: any): Promise<T> {
        const url = this.buildUrl(path);
        return this.request<T>(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    /**
     * PATCH 요청
     */
    protected async patch<T>(path: string, body: any): Promise<T> {
        const url = this.buildUrl(path);
        return this.request<T>(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    /**
     * DELETE 요청
     */
    protected async delete<T>(path: string, body?: any): Promise<T> {
        const url = this.buildUrl(path);
        const options: RequestOptions = {
            method: 'DELETE',
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
        };
        
        return this.request<T>(url, options);
    }

    /**
     * HEAD 요청
     */
    protected async head(path: string = ''): Promise<void> {
        const url = this.buildUrl(path);
        await this.request<void>(url, { method: 'HEAD' });
    }

    // === 인터셉터 관리 ===

    /**
     * 응답 인터셉터 추가
     */
    public addResponseInterceptor(interceptor: ResponseInterceptor): void {
        this.responseInterceptors.push(interceptor);
    }

    /**
     * 에러 인터셉터 추가 (타입 안전)
     */
    public addErrorInterceptor<T = unknown>(interceptor: ErrorInterceptor<T>): void {
        this.errorInterceptors.push(interceptor as ErrorInterceptor);
    }

    /**
     * 모든 인터셉터 제거
     */
    public clearInterceptors(): void {
        this.responseInterceptors = [];
        this.errorInterceptors = [];
    }

    // === 요청 취소 관리 ===

    /**
     * 특정 요청 취소
     */
    public cancelRequest(requestId: string): void {
        const controller = this.activeRequests.get(requestId);
        if (controller) {
            controller.abort();
            this.activeRequests.delete(requestId);
        }
    }

    /**
     * 모든 진행 중인 요청 취소
     */
    public cancelAllRequests(): void {
        this.activeRequests.forEach(controller => controller.abort());
        this.activeRequests.clear();
    }

    // === Private 헬퍼 메서드 ===

    /**
     * URL 생성
     */
    private buildUrl(path: string = '', params?: Record<string, any>): string {
        const baseUrl = new URL(this.apiPrefix + path, window.location.origin);
        
        if (params) {
            // null/undefined 제거
            const cleanParams = Object.entries(params)
                .filter(([_, value]) => value !== null && value !== undefined)
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, any>);
            
            // 쿼리 스트링 추가
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
    private async request<T>(url: string, options: RequestOptions): Promise<T> {
        const mergedOptions: RequestOptions = {
            ...this.defaultOptions,
            ...options,
            credentials: this.defaultOptions.withCredentials ? 'include' : 'same-origin'
        };
        
        // 요청 ID 생성
        const requestId = `${options.method}-${url}-${Date.now()}`;
        
        // AbortController 생성
        const controller = new AbortController();
        this.activeRequests.set(requestId, controller);
        
        // 타임아웃 처리
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, mergedOptions.timeout!);
        
        // fetch에 전달할 옵션 준비
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
            
            // 에러 처리
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
                        // 인터셉터 에러는 무시하고 원래 에러 처리 계속
                    }
                }
                
                throw error;
            }
            
            // 204 No Content
            if (response.status === 204) {
                return null as any;
            }
            
            // HEAD 요청
            if (options.method === 'HEAD') {
                return null as any;
            }
            
            // Content-Type 확인
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                return await response.json();
            } else if (contentType?.includes('text/')) {
                return await response.text() as any;
            } else {
                // 기타 타입은 blob으로
                return await response.blob() as any;
            }
            
        } catch (error: any) {
            clearTimeout(timeoutId);
            
            // 타임아웃 에러
            if (error.name === 'AbortError') {
                const timeoutError: ApiError = {
                    status: 0,
                    statusText: 'Timeout',
                    message: `Request timeout after ${mergedOptions.timeout}ms`,
                    timestamp: new Date().toISOString(),
                    requestId
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
                
                return this.request<T>(url, retryOptions);
            }
            
            console.error('[Model] Request failed:', error);
            throw error;
        } finally {
            // 요청 추적에서 제거
            this.activeRequests.delete(requestId);
        }
    }

    /**
     * API 에러 객체 생성 (타입 안전성 강화)
     */
    private async createApiError<T = unknown>(response: Response): Promise<ApiError<T>> {
        let data: T | undefined;
        let message: string | undefined;
        
        try {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const jsonData = await response.json();
                data = jsonData as T;
                message = jsonData?.message || jsonData?.error;
            } else {
                const textData = await response.text();
                message = textData;
            }
        } catch {
            message = 'Failed to parse error response';
        }
        
        const error: ApiError<T> = {
            status: response.status,
            statusText: response.statusText,
            message: message || `HTTP ${response.status} ${response.statusText}`,
            data,
            timestamp: new Date().toISOString(),
            requestId: response.headers.get('x-request-id') || undefined
        };
        
        return error;
    }

    /**
     * 재시도 가능한 에러인지 확인
     */
    private isRetryableError(error: any): boolean {
        // 네트워크 에러 또는 5xx 서버 에러
        return !error.status || (error.status >= 500 && error.status < 600);
    }

    /**
     * 지연 유틸리티
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === 유틸리티 메서드 ===

    /**
     * 기본 옵션 설정
     */
    public setDefaultOptions(options: Partial<RequestOptions>): void {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }

    /**
     * API 엔드포인트 URL 가져오기
     */
    public getEndpoint(path: string = ''): string {
        return this.apiPrefix + path;
    }

    /**
     * 현재 API 어댑터 가져오기
     */
    public getApiAdapter(): IApiAdapter {
        return this.apiAdapter;
    }
    
    /**
     * 커스텀 API 어댑터 설정
     */
    public setApiAdapter(adapter: IApiAdapter): void {
        this.apiAdapter = adapter;
    }
    
    /**
     * 정리 메서드
     */
    public destroy(): void {
        this.cancelAllRequests();
        this.clearInterceptors();
    }
}