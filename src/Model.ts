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
 * @version 0.1.0
 */
import type { Aits } from './Aits';
import type { IApiAdapter, AitsPaginationOptions } from './ApiAdapter';

export abstract class Model {
    protected aits: Aits;
    protected apiAdapter: IApiAdapter;
    
    // 각 모델이 담당하는 API의 기본 경로 (e.g., '/api/v1/users')
    // 하위 클래스에서 이 값을 재정의해야 합니다.
    protected abstract readonly apiPrefix: string;

    constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
        this.apiAdapter = this.aits.apiAdapter;
    }

    /**
     * 데이터 객체에서 Primary Key 값을 가져옵니다.
     * ApiAdapter에 정의된 PK 필드명을 사용합니다.
     * @param data - API로부터 받은 데이터 객체
     * @returns Primary Key 값 또는 undefined
     */
    public getPkValue(data: Record<string, any>): string | number | undefined {
        const pkField = this.apiAdapter.getPrimaryKeyField();
        return data?.[pkField];
    }

    /**
     * ID로 단일 데이터를 조회합니다.
     */
    public getOne<T>(id: string | number): Promise<T> {
        return this.get<T>(`/${id}`);
    }

    /**
     * 새로운 데이터를 생성합니다. (POST)
     */
    public createOne<T>(data: object): Promise<T> {
        return this.post<T>('', data);
    }

    /**
     * 기존 데이터 전체를 수정합니다. (PUT)
     */
    public updateOne<T>(id: string | number, data: object): Promise<T> {
        return this.put<T>(`/${id}`, data);
    }

    /**
     * 특정 데이터의 일부를 수정합니다. (PATCH)
     */
    public patchOne<T>(id: string | number, data: object): Promise<T> {
        return this.patch<T>(`/${id}`, data);
    }

    /**
     * 특정 데이터를 삭제합니다. (DELETE)
     */
    public removeOne<T>(id: string | number): Promise<T> {
        return this.delete<T>(`/${id}`);
    }

    /**
     * 페이지네이션이 적용된 목록 조회를 위한 표준 헬퍼 메소드.
     * 내부적으로 API 어댑터를 사용하여 파라미터를 변환합니다.
     */
    public getPaged<T>(options: AitsPaginationOptions = {}): Promise<T> {
        // 1. Aits 표준 옵션을 어댑터에게 전달하여,
        const backendParams = this.apiAdapter.transformDataOptions(options);
        
        // 2. 백엔드에 맞는 파라미터로 변환된 결과를 받아 API를 호출합니다.
        return this.get<T>('', backendParams);
    }

    /**
     * 여러 개의 데이터를 한 번에 생성합니다.
     * @param data - 생성할 데이터 객체의 배열
     */
    public createMany<T>(data: object[]): Promise<T> {
        // 백엔드 API는 POST /api/prefix/bulk 와 같은 엔드포인트를 지원해야 합니다.
        return this.post<T>('/bulk', data);
    }

    /**
     * 여러 개의 데이터를 한 번에 수정합니다. (전체 필드)
     * @param data - 수정할 데이터 객체의 배열. 각 객체는 id를 포함해야 합니다.
     */
    public updateMany<T>(data: { id: string | number; [key: string]: any }[]): Promise<T> {
        // 백엔드 API는 PUT /api/prefix/bulk 와 같은 엔드포인트를 지원해야 합니다.
        return this.put<T>('/bulk', data);
    }

    /**
     * 여러 개의 데이터를 한 번에 부분 수정합니다.
     * @param data - 수정할 데이터 객체의 배열. 각 객체는 id를 포함해야 합니다.
     */
    public patchMany<T>(data: { id: string | number; [key: string]: any }[]): Promise<T> {
        // 백엔드 API는 PATCH /api/prefix/bulk 와 같은 엔드포인트를 지원해야 합니다.
        return this.patch<T>('/bulk', data);
    }

    /**
     * 여러 개의 데이터를 한 번에 삭제합니다.
     * @param ids - 삭제할 데이터의 ID 배열
     */
    public removeMany<T>(ids: (string | number)[]): Promise<T> {
        // 백엔드 API는 DELETE /api/prefix/bulk 와 같이 body에 데이터를 담아 요청하는 것을 지원해야 합니다.
        // 만약 지원하지 않는 경우, POST /api/prefix/bulk-delete 같은 대체 엔드포인트를 사용해야 할 수 있습니다.
        return this.delete<T>('/bulk', { ids });
    }

    /**
     * GET 요청을 보내고 JSON 응답을 반환합니다.
     * @param path - apiPrefix 뒤에 붙는 상세 경로 (e.g., '/123')
     * @param params - URL 쿼리 파라미터로 추가할 객체
     * @returns API 응답을 resolve하는 Promise
     */
    protected async get<T>(path: string = '', params?: Record<string, any>): Promise<T> {
        const url = new URL(this.apiPrefix + path, window.location.origin);
        if (params) {
            // null이나 undefined 값을 가진 파라미터는 제외
            Object.keys(params).forEach(key => {
                if (params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });
            url.search = new URLSearchParams(params).toString();
        }
        return this.request<T>(url.toString(), { method: 'GET' });
    }

    /**
     * POST 요청을 보내고 JSON 응답을 반환합니다.
     * @param path - apiPrefix 뒤에 붙는 상세 경로
     * @param body - 요청 본문에 담을 데이터 객체
     * @returns API 응답을 resolve하는 Promise
     */
    protected async post<T>(path: string = '', body?: object): Promise<T> {
        const url = this.apiPrefix + path;
        return this.request<T>(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    /**
     * PUT 요청을 보내고 JSON 응답을 반환합니다.
     * @param path - apiPrefix 뒤에 붙는 상세 경로
     * @param body - 요청 본문에 담을 데이터 객체
     * @returns API 응답을 resolve하는 Promise
     */
    protected async put<T>(path: string, body: object): Promise<T> {
        const url = this.apiPrefix + path;
        return this.request<T>(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    /**
     * PATCH 요청을 보내고 JSON 응답을 반환합니다.
     * @param path - apiPrefix 뒤에 붙는 상세 경로
     * @param body - 요청 본문에 담을 데이터 객체
     */
    protected async patch<T>(path: string, body: object): Promise<T> {
        const url = this.apiPrefix + path;
        return this.request<T>(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    /**
     * DELETE 요청을 보내고 JSON 응답을 반환합니다.
     * @param path - apiPrefix 뒤에 붙는 상세 경로
     * @param body - 요청 본문에 담을 데이터 객체
     * @returns API 응답을 resolve하는 Promise
     */
    protected async delete<T>(path: string, body?: object): Promise<T> {
        const url = this.apiPrefix + path;
        const options: RequestInit = { method: 'DELETE' };
        if (body) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        }
        return this.request<T>(url, options);
    }

    /**
     * 모든 HTTP 요청을 처리하는 중앙 fetch 래퍼 메소드입니다.
     * @param url - 요청할 전체 URL
     * @param options - fetch API에 전달할 옵션
     */
    private async request<T>(url: string, options: RequestInit): Promise<T> {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                // 서버가 에러 응답을 보냈을 경우
                const errorData = await response.json().catch(() => ({ message: 'Invalid JSON response' }));
                throw new Error(`API Error: ${response.status} ${response.statusText}`, {
                    cause: errorData
                });
            }
            
            // 204 No Content 같은 경우, 본문이 없을 수 있음
            if (response.status === 204) {
                return null as T;
            }

            return await response.json();
        } catch (error) {
            console.error('[Aits Model] Request failed:', error);
            throw error; // 에러를 다시 던져서 상위 로직(Controller 등)에서 처리할 수 있도록 함
        }
    }
}