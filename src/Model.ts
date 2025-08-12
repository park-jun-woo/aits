/**
 * =================================================================
 * Model.ts - Aits 애플리케이션 데이터 처리의 기반
 * =================================================================
 * @description
 * - 모든 데이터 모델 클래스가 상속받아야 하는 추상 클래스입니다.
 * - 백엔드 API와의 통신(CRUD)을 위한 표준화된 인터페이스를 제공합니다.
 * - fetch API를 래핑하여 반복적인 코드를 줄이고, AI가 API 연동 로직을
 * 쉽게 생성할 수 있도록 돕습니다.
 * @author Aits Framework AI
 * @version 0.2.1
 */

import type { Aits } from './Aits';
import type { IApiAdapter, AitsDataOptions } from './ApiAdapter';

// API 에러 정보
export interface ApiError {
    status: number;
    statusText: string;
    message?: string;
    data?: any;
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
export type ErrorInterceptor = (error: ApiError) => Promise<any>;

export abstract class Model {
    protected aits: Aits;
    protected apiAdapter: IApiAdapter;
    
    // 각 모델이 담당하는 API의 기본 경로 (e.g., '/api/v1/users')
    protected abstract readonly apiPrefix: string;
    
    // 기본 요청 옵션
    protected defaultOptions: RequestOptions = {
        timeout: 30000,      // 30초
        retries: 0,          // 재시도 안함
        retryDelay: 1000,    // 1초
        withCredentials: true // 쿠키 포함
    };
    
    // 인터셉터
    private responseInterceptors: ResponseInterceptor[] = [];
    private errorInterceptors: ErrorInterceptor[] = [];

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

    // === 단일 데이터 CRUD 메서드 ===

    /**
     * ID로 단일 데이터를 조회합니다.
     */
    public getOne<T = any>(id: string | number, params?: Record<string, any>): Promise<T> {
        return this.get<T>(`/${id}`, params);
    }

    /**
     * 새로운 데이터를 생성합니다.
     */
    public createOne<T = any>(data: object): Promise<T> {
        return this.post<T>('', data);
    }

    /**
     * 기존 데이터 전체를 수정합니다.
     */
    public updateOne<T = any>(id: string | number, data: object): Promise<T> {
        return this.put<T>(`/${id}`, data);
    }

    /**
     * 특정 데이터의 일부를 수정합니다.
     */
    public patchOne<T = any>(id: string | number, data: object): Promise<T> {
        return this.patch<T>(`/${id}`, data);
    }

    /**
     * 특정 데이터를 삭제합니다.
     */
    public removeOne<T = any>(id: string | number): Promise<T> {
        return this.delete<T>(`/${id}`);
    }

    // === 목록 조회 메서드 ===

    /**
     * 전체 목록을 조회합니다.
     */
    public getAll<T = any>(params?: Record<string, any>): Promise<T> {
        return this.get<T>('', params);
    }

    /**
     * 페이지네이션이 적용된 목록을 조회합니다.
     */
    public getPaged<T = any>(options: AitsDataOptions = {}): Promise<T> {
        const backendParams = this.apiAdapter.transformDataOptions(options);
        return this.get<T>('', backendParams);
    }

    /**
     * 검색 조건으로 목록을 조회합니다.
     */
    public search<T = any>(query: string, options: AitsDataOptions = {}): Promise<T> {
        const params = this.apiAdapter.transformDataOptions({
            ...options,
            search: query
        });
        return this.get<T>('/search', params);
    }

    /**
     * 필터 조건으로 목록을 조회합니다.
     */
    public filter<T = any>(filters: Record<string, any>, options: AitsDataOptions = {}): Promise<T> {
        const params = this.apiAdapter.transformDataOptions({
            ...options,
            filter: filters
        });
        return this.get<T>('', params);
    }

    // === 벌크 작업 메서드 ===

    /**
     * 여러 개의 데이터를 한 번에 생성합니다.
     */
    public createMany<T = any>(data: object[]): Promise<T> {
        return this.post<T>('/bulk', data);
    }

    /**
     * 여러 개의 데이터를 한 번에 수정합니다.
     */
    public updateMany<T = any>(data: Array<Record<string, any>>): Promise<T> {
        // PK 필드가 포함되어 있는지 확인
        const pkField = this.apiAdapter.getPrimaryKeyField();
        const invalidItems = data.filter(item => !item[pkField]);
        
        if (invalidItems.length > 0) {
            throw new Error(`[Model] Missing primary key '${pkField}' in ${invalidItems.length} items`);
        }
        
        return this.put<T>('/bulk', data);
    }

    /**
     * 여러 개의 데이터를 한 번에 부분 수정합니다.
     */
    public patchMany<T = any>(data: Array<Record<string, any>>): Promise<T> {
        const pkField = this.apiAdapter.getPrimaryKeyField();
        const invalidItems = data.filter(item => !item[pkField]);
        
        if (invalidItems.length > 0) {
            throw new Error(`[Model] Missing primary key '${pkField}' in ${invalidItems.length} items`);
        }
        
        return this.patch<T>('/bulk', data);
    }

    /**
     * 여러 개의 데이터를 한 번에 삭제합니다.
     */
    public removeMany<T = any>(ids: (string | number)[]): Promise<T> {
        if (ids.length === 0) {
            throw new Error('[Model] No IDs provided for bulk delete');
        }
        
        return this.delete<T>('/bulk', { ids });
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
     * 에러 인터셉터 추가
     */
    public addErrorInterceptor(interceptor: ErrorInterceptor): void {
        this.errorInterceptors.push(interceptor);
    }

    /**
     * 모든 인터셉터 제거
     */
    public clearInterceptors(): void {
        this.responseInterceptors = [];
        this.errorInterceptors = [];
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
                    // 배열 처리
                    value.forEach(v => baseUrl.searchParams.append(key, String(v)));
                } else if (typeof value === 'object') {
                    // 객체는 JSON 문자열로
                    baseUrl.searchParams.append(key, JSON.stringify(value));
                } else {
                    baseUrl.searchParams.append(key, String(value));
                }
            });
        }
        
        return baseUrl.toString();
    }

    /**
     * HTTP 요청 실행
     */
    private async request<T>(url: string, options: RequestOptions): Promise<T> {
        const mergedOptions: RequestOptions = {
            ...this.defaultOptions,
            ...options,
            credentials: this.defaultOptions.withCredentials ? 'include' : 'same-origin'
        };
        
        // 타임아웃 처리
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, mergedOptions.timeout!);
        
        // fetch에 전달할 옵션 준비 (커스텀 속성 제거)
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
                throw new Error(`[Model] Request timeout after ${mergedOptions.timeout}ms`);
            }
            
            // 재시도 로직
            if (mergedOptions.retries! > 0 && this.isRetryableError(error)) {
                console.log(`[Model] Retrying request (${mergedOptions.retries} attempts left)`);
                await this.delay(mergedOptions.retryDelay!);
                
                // 재시도를 위한 새로운 옵션 객체 생성
                const retryOptions: RequestOptions = {
                    ...options,
                    retries: mergedOptions.retries! - 1
                };
                
                return this.request<T>(url, retryOptions);
            }
            
            console.error('[Model] Request failed:', error);
            throw error;
        }
    }

    /**
     * API 에러 객체 생성
     */
    private async createApiError(response: Response): Promise<ApiError> {
        let data: any;
        
        try {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
        } catch {
            data = { message: 'Failed to parse error response' };
        }
        
        const error: ApiError = {
            status: response.status,
            statusText: response.statusText,
            message: data?.message || data?.error || `HTTP ${response.status} ${response.statusText}`,
            data
        };
        
        return error;
    }

    /**
     * 재시도 가능한 에러인지 확인
     */
    private isRetryableError(error: any): boolean {
        // 네트워크 에러 또는 5xx 서버 에러
        return !error.status || error.status >= 500;
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
}