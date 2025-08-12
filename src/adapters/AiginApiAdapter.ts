/**
 * Aigin API Adapter
 * 
 * Aigin 표준 필드명:
 * - Primary Key: id
 * - 생성일: created_at
 * - 수정일: updated_at
 * - 검색어: search
 * - 정렬: order, desc
 * - 페이지네이션: page, limit
 * - 목록 항목들: items
 */

import { IApiAdapter, AitsDataOptions, ApiStyle, DefaultApiAdapter } from '../ApiAdapter';

export interface AiginResponse<T = any> {
    items: T[];           // 목록 데이터
    total: number;        // 전체 개수
    page: number;         // 현재 페이지
    limit: number;        // 페이지당 항목 수
    total_pages: number;  // 전체 페이지 수
    has_next: boolean;    // 다음 페이지 존재 여부
    has_prev: boolean;    // 이전 페이지 존재 여부
}

export interface AiginErrorResponse {
    error: {
        code: string;      // 에러 코드
        message: string;   // 에러 메시지
        details?: any;     // 상세 정보
    };
    timestamp: string;     // 에러 발생 시각
    request_id: string;    // 요청 추적 ID
}

export class AiginApiAdapter extends DefaultApiAdapter implements IApiAdapter {
    constructor() {
        super({
            style: 'rest-like' as ApiStyle,
            primaryKey: 'id'
        });
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        const params: Record<string, any> = {};
        
        // Aigin 표준 페이지네이션
        if (options.page !== undefined) {
            params.page = options.page;
        }
        if (options.limit !== undefined) {
            params.limit = options.limit;
        }
        
        // Aigin 표준 정렬
        if (options.sort) {
            if (typeof options.sort === 'string') {
                params.order = options.sort;
                params.desc = options.order === 'desc' ? true : false;
            } else if (Array.isArray(options.sort)) {
                // 다중 정렬: "field1:asc,field2:desc" 형식
                const sortStrings = options.sort.map(s => 
                    `${s.field}:${s.order === 'desc' ? 'desc' : 'asc'}`
                );
                params.order = sortStrings.join(',');
            }
        }
        
        // Aigin 표준 검색
        if (options.search || options.q) {
            params.search = options.search || options.q;
        }
        
        // 날짜 범위 필터 (created_at, updated_at)
        if (options.filter?.created_at) {
            this.addDateFilter(params, 'created_at', options.filter.created_at);
        }
        if (options.filter?.updated_at) {
            this.addDateFilter(params, 'updated_at', options.filter.updated_at);
        }
        
        // 필드 선택
        if (options.fields?.length) {
            params.fields = options.fields.join(',');
        }
        if (options.exclude?.length) {
            params.exclude = options.exclude.join(',');
        }
        
        // 관계 데이터 포함
        if (options.include?.length) {
            params.include = options.include.join(',');
        }
        if (options.expand?.length) {
            params.expand = options.expand.join(',');
        }
        
        // 상태 필터 (Aigin 공통)
        if (options.filter?.status) {
            params.status = options.filter.status;
        }
        
        // 삭제 여부 필터
        if (options.filter?.deleted !== undefined) {
            params.deleted = options.filter.deleted;
        }
        
        // 활성화 여부 필터
        if (options.filter?.active !== undefined) {
            params.active = options.filter.active;
        }
        
        // 카테고리/태그 필터
        if (options.filter?.category) {
            params.category = options.filter.category;
        }
        if (options.filter?.tags) {
            params.tags = Array.isArray(options.filter.tags) 
                ? options.filter.tags.join(',')
                : options.filter.tags;
        }
        
        // 사용자 관련 필터
        if (options.filter?.user_id) {
            params.user_id = options.filter.user_id;
        }
        if (options.filter?.created_by) {
            params.created_by = options.filter.created_by;
        }
        if (options.filter?.updated_by) {
            params.updated_by = options.filter.updated_by;
        }
        
        // 조직/프로젝트 필터
        if (options.filter?.organization_id) {
            params.organization_id = options.filter.organization_id;
        }
        if (options.filter?.project_id) {
            params.project_id = options.filter.project_id;
        }
        
        // 범위 필터 (숫자, 금액 등)
        if (options.filter?.min_price !== undefined) {
            params.min_price = options.filter.min_price;
        }
        if (options.filter?.max_price !== undefined) {
            params.max_price = options.filter.max_price;
        }
        
        // 지역/언어 설정
        if (options.locale) {
            params.locale = options.locale;
        }
        if (options.timezone) {
            params.timezone = options.timezone;
        }
        
        // 디버그 모드
        if (options.debug) {
            params.debug = true;
        }
        
        // 기타 필터 (미리 정의된 키 제외)
        const excludeKeys = [
            'created_at', 'updated_at', 'status', 'deleted', 'active',
            'category', 'tags', 'user_id', 'created_by', 'updated_by',
            'organization_id', 'project_id', 'min_price', 'max_price'
        ];
        
        if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
                if (!excludeKeys.includes(key) && value !== undefined) {
                    // 중첩 객체는 플랫하게 변환
                    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                        Object.entries(value).forEach(([subKey, subValue]) => {
                            params[`${key}.${subKey}`] = subValue;
                        });
                    } else {
                        params[key] = value;
                    }
                }
            });
        }
        
        return params;
    }
    
    /**
     * 날짜 필터 추가 (범위 쿼리 지원)
     */
    private addDateFilter(params: Record<string, any>, field: string, dateFilter: any): void {
        if (typeof dateFilter === 'string' || dateFilter instanceof Date) {
            // 단일 날짜는 해당 날짜의 시작과 끝
            const date = new Date(dateFilter);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();
            params[`${field}_from`] = startOfDay;
            params[`${field}_to`] = endOfDay;
        } else if (typeof dateFilter === 'object') {
            // 범위 쿼리
            if (dateFilter.from || dateFilter.gte) {
                params[`${field}_from`] = new Date(dateFilter.from || dateFilter.gte).toISOString();
            }
            if (dateFilter.to || dateFilter.lte) {
                params[`${field}_to`] = new Date(dateFilter.to || dateFilter.lte).toISOString();
            }
            if (dateFilter.gt) {
                const date = new Date(dateFilter.gt);
                date.setMilliseconds(date.getMilliseconds() + 1);
                params[`${field}_from`] = date.toISOString();
            }
            if (dateFilter.lt) {
                const date = new Date(dateFilter.lt);
                date.setMilliseconds(date.getMilliseconds() - 1);
                params[`${field}_to`] = date.toISOString();
            }
        }
    }
    
    /**
     * Aigin API 표준 헤더
     */
    getHeaders(): Record<string, string> {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Aigin-Version': 'v1',  // Aigin API 버전
            'X-Request-ID': this.generateRequestId()  // 요청 추적용
        };
    }
    
    /**
     * 요청 ID 생성
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Aigin API 엔드포인트 변환
     */
    transformEndpoint(baseUrl: string, operation: string, id?: string | number): string {
        // Aigin은 RESTful 규칙을 따름
        switch (operation) {
            case 'list':
            case 'create':
                return baseUrl;
            case 'get':
            case 'update':
            case 'patch':
            case 'delete':
                return id ? `${baseUrl}/${id}` : baseUrl;
            case 'search':
                return `${baseUrl}/search`;
            case 'bulk':
                return `${baseUrl}/bulk`;
            case 'count':
                return `${baseUrl}/count`;
            case 'exists':
                return id ? `${baseUrl}/${id}/exists` : `${baseUrl}/exists`;
            case 'duplicate':
                return `${baseUrl}/check-duplicate`;
            default:
                return baseUrl;
        }
    }
    
    /**
     * 응답 데이터 변환
     * Aigin API는 목록 응답을 { items: [], total: number, ... } 형식으로 반환
     */
    transformResponse<T = any>(response: any, operation: string): T {
        if (operation === 'list' || operation === 'search') {
            // 목록 응답은 그대로 반환 (Model에서 items 추출)
            return response as T;
        }
        return response as T;
    }
    
    /**
     * 에러 응답 처리
     */
    transformError(error: AiginErrorResponse): Error {
        const err = new Error(error.error.message);
        (err as any).code = error.error.code;
        (err as any).details = error.error.details;
        (err as any).requestId = error.request_id;
        (err as any).timestamp = error.timestamp;
        return err;
    }
}