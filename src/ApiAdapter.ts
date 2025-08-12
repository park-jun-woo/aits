/**
 * =================================================================
 * ApiAdapter.ts - HTTP API 통신 표준화 어댑터
 * =================================================================
 * @description
 * - AITS 프레임워크의 표준 요청을 다양한 HTTP API 규약에 맞게 변환합니다.
 * - RESTful, REST-like, RPC over HTTP 등 다양한 API 스타일을 지원합니다.
 * - GraphQL, SOAP 등 다른 프로토콜은 별도 어댑터가 필요합니다.
 * 
 * @supports
 * - ✅ RESTful APIs (GET /users, POST /users, etc.)
 * - ✅ REST-like APIs (대부분의 실무 API)
 * - ✅ RPC over HTTP (POST /api/method)
 * - ✅ Legacy HTTP APIs
 * 
 * @examples
 * - GitHub API, Stripe API (REST-like)
 * - Slack Web API, Discord API (RPC style)
 * - Custom enterprise APIs
 * 
 * @author Aits Framework AI
 * @version 0.3.0
 */

// === 기본 데이터 옵션 인터페이스 ===

/**
 * 페이지네이션 옵션
 */
export interface AitsPaginationOptions {
    page?: number;        // 페이지 번호 (1부터 시작)
    limit?: number;       // 페이지당 항목 수
    offset?: number;      // 스킵할 항목 수 (page 대신 사용 가능)
    cursor?: string;      // 커서 기반 페이지네이션
}

/**
 * 정렬 옵션
 */
export interface AitsSortOptions {
    sort?: string | Array<{field: string; order: 'asc' | 'desc'}>;  // 정렬 필드
    order?: 'asc' | 'desc';  // 정렬 방향 (sort가 문자열일 때)
}

/**
 * 검색 옵션
 */
export interface AitsSearchOptions {
    search?: string;      // 전체 텍스트 검색
    q?: string;          // 검색 쿼리 (search 별칭)
}

/**
 * 필드 선택 옵션
 */
export interface AitsFieldOptions {
    fields?: string[];    // 포함할 필드
    exclude?: string[];   // 제외할 필드
    include?: string[];   // 포함할 관계 데이터
    expand?: string[];    // 확장할 중첩 관계
}

/**
 * 통합 데이터 요청 옵션
 */
export interface AitsDataOptions extends 
    AitsPaginationOptions, 
    AitsSortOptions, 
    AitsSearchOptions,
    AitsFieldOptions {
    filter?: Record<string, any>;  // 필터 조건
    where?: Record<string, any>;   // WHERE 조건 (filter 별칭)
    locale?: string;               // 언어/지역 설정
    timezone?: string;             // 타임존
    debug?: boolean;               // 디버그 모드
}

// === API 스타일 정의 ===

export type ApiStyle = 'rest' | 'rest-like' | 'rpc' | 'legacy' | 'custom';

/**
 * API 엔드포인트 매핑 설정
 */
export interface EndpointMapping {
    list?: string;        // 목록 조회 경로
    get?: string;        // 단일 조회 경로
    create?: string;     // 생성 경로
    update?: string;     // 수정 경로
    patch?: string;      // 부분 수정 경로
    delete?: string;     // 삭제 경로
    search?: string;     // 검색 경로
    bulk?: string;       // 벌크 작업 경로
}

/**
 * API 어댑터 설정
 */
export interface ApiAdapterConfig {
    style?: ApiStyle;
    primaryKey?: string;
    endpoints?: EndpointMapping;
    headers?: Record<string, string>;
    parameterNames?: Record<string, string>;  // 파라미터 이름 매핑
}

// === 메인 인터페이스 ===

/**
 * 모든 API 어댑터가 구현해야 하는 인터페이스
 */
export interface IApiAdapter {
    /**
     * AITS 표준 옵션을 API별 파라미터로 변환
     */
    transformDataOptions(options: AitsDataOptions): Record<string, any>;
    
    /**
     * Primary Key 필드명 반환
     */
    getPrimaryKeyField(): string;
    
    /**
     * API 스타일 반환 (선택적)
     */
    getApiStyle?(): ApiStyle;
    
    /**
     * 엔드포인트 URL 변환 (선택적)
     */
    transformEndpoint?(baseUrl: string, operation: string, id?: string | number): string;
    
    /**
     * 요청 헤더 추가 (선택적)
     */
    getHeaders?(): Record<string, string>;
}

// === 기본 구현 ===

/**
 * 기본 API 어댑터 (대부분의 REST-like API와 호환)
 */
export class DefaultApiAdapter implements IApiAdapter {
    protected config: ApiAdapterConfig;
    
    constructor(config: ApiAdapterConfig = {}) {
        this.config = {
            style: 'rest-like',
            primaryKey: 'id',
            ...config
        };
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        const params: Record<string, any> = {};
        
        // 페이지네이션
        if (options.page !== undefined) {
            params.page = options.page;
        }
        if (options.limit !== undefined) {
            params.limit = options.limit;
        }
        if (options.offset !== undefined) {
            params.offset = options.offset;
        }
        if (options.cursor !== undefined) {
            params.cursor = options.cursor;
        }
        
        // 정렬
        if (options.sort) {
            if (typeof options.sort === 'string') {
                params.sort = options.sort;
                if (options.order) {
                    params.order = options.order;
                }
            } else {
                // 다중 정렬을 문자열로 변환
                params.sort = options.sort
                    .map(s => `${s.field}:${s.order}`)
                    .join(',');
            }
        }
        
        // 검색
        if (options.search) {
            params.search = options.search;
        } else if (options.q) {
            params.q = options.q;
        }
        
        // 필드 선택
        if (options.fields?.length) {
            params.fields = options.fields.join(',');
        }
        if (options.exclude?.length) {
            params.exclude = options.exclude.join(',');
        }
        if (options.include?.length) {
            params.include = options.include.join(',');
        }
        if (options.expand?.length) {
            params.expand = options.expand.join(',');
        }
        
        // 필터
        if (options.filter) {
            Object.assign(params, this.transformFilter(options.filter));
        } else if (options.where) {
            Object.assign(params, this.transformFilter(options.where));
        }
        
        // 기타 옵션
        if (options.locale) params.locale = options.locale;
        if (options.timezone) params.timezone = options.timezone;
        if (options.debug) params.debug = options.debug;
        
        return params;
    }
    
    /**
     * 필터 조건 변환
     */
    protected transformFilter(filter: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};
        
        for (const [key, value] of Object.entries(filter)) {
            if (value === null || value === undefined) continue;
            
            // 복잡한 조건 처리
            if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                // 연산자 기반 필터 (e.g., {age: {gte: 18, lt: 65}})
                for (const [op, val] of Object.entries(value)) {
                    result[`${key}[${op}]`] = val;
                }
            } else {
                result[key] = value;
            }
        }
        
        return result;
    }
    
    getPrimaryKeyField(): string {
        return this.config.primaryKey || 'id';
    }
    
    getApiStyle(): ApiStyle {
        return this.config.style || 'rest-like';
    }
    
    getHeaders(): Record<string, string> {
        return this.config.headers || {};
    }
    
    /**
     * 엔드포인트 URL 변환 (기본 구현)
     */
    transformEndpoint(baseUrl: string, operation: string, id?: string | number): string {
        // 기본 RESTful 패턴
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
            default:
                return baseUrl;
        }
    }
}

// === 특화된 어댑터 구현 ===

/**
 * 엄격한 RESTful API 어댑터
 */
export class RestfulApiAdapter extends DefaultApiAdapter {
    constructor(config: ApiAdapterConfig = {}) {
        super({
            style: 'rest',
            ...config
        });
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        const params = super.transformDataOptions(options);
        
        // RESTful 표준에 맞게 조정
        // HAL, JSON:API 등의 표준 지원
        if (options.include?.length) {
            // JSON:API 스타일
            params['include'] = options.include.join(',');
            delete params.include;
        }
        
        // 필터를 filter[] 형식으로
        if (options.filter) {
            for (const [key, value] of Object.entries(options.filter)) {
                params[`filter[${key}]`] = value;
            }
            delete params.filter;
        }
        
        return params;
    }
    
    transformEndpoint(baseUrl: string, operation: string, id?: string | number): string {
        // RESTful 규칙에 따른 엔드포인트
        switch (operation) {
            case 'list':
            case 'create':
                return baseUrl;
            case 'get':
            case 'update':
            case 'delete':
                return `${baseUrl}/${id}`;
            case 'search':
                return `${baseUrl}/search`;
            default:
                return baseUrl;
        }
    }
}

/**
 * RPC 스타일 API 어댑터
 */
export class RpcApiAdapter extends DefaultApiAdapter {
    constructor(config: ApiAdapterConfig = {}) {
        super({
            style: 'rpc',
            ...config
        });
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        // RPC 스타일: 모든 파라미터를 하나의 객체로
        return {
            method: 'list',  // 기본 메서드
            params: {
                pagination: {
                    page: options.page || 1,
                    limit: options.limit || 20,
                    offset: options.offset
                },
                sort: options.sort,
                search: options.search || options.q,
                filter: options.filter || options.where,
                fields: options.fields,
                include: options.include
            }
        };
    }
    
    transformEndpoint(baseUrl: string, operation: string, id?: string | number): string {
        // RPC는 보통 단일 엔드포인트 사용
        const methodMap: Record<string, string> = {
            list: 'getList',
            get: 'getItem',
            create: 'createItem',
            update: 'updateItem',
            delete: 'deleteItem',
            search: 'searchItems'
        };
        
        return `${baseUrl}/${methodMap[operation] || operation}`;
    }
}

/**
 * 레거시 API 어댑터
 */
export class LegacyApiAdapter extends DefaultApiAdapter {
    constructor(config: ApiAdapterConfig = {}) {
        super({
            style: 'legacy',
            primaryKey: config.primaryKey || 'item_no',
            ...config
        });
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        // 레거시 API의 일반적인 파라미터 이름
        const params: Record<string, any> = {};
        
        // 페이지네이션 (오프셋 기반)
        const page = options.page || 1;
        const limit = options.limit || 30;
        params.start = options.offset ?? (page - 1) * limit;
        params.length = limit;
        
        // 정렬 (언더스코어 스타일)
        if (options.sort) {
            if (typeof options.sort === 'string') {
                params.sort_by = options.sort;
                params.sort_order = options.order?.toUpperCase() || 'ASC';
            }
        }
        
        // 검색
        if (options.search || options.q) {
            params.query = options.search || options.q;
        }
        
        // 필터 (플랫한 구조)
        if (options.filter) {
            for (const [key, value] of Object.entries(options.filter)) {
                params[`filter_${key}`] = value;
            }
        }
        
        // 액션 파라미터 (레거시 스타일)
        params.action = 'list';
        params.format = 'json';
        
        return params;
    }
    
    transformEndpoint(baseUrl: string, operation: string, id?: string | number): string {
        // 레거시 API는 쿼리 파라미터로 액션 구분
        const actionMap: Record<string, string> = {
            list: 'list',
            get: 'view',
            create: 'add',
            update: 'edit',
            delete: 'remove',
            search: 'find'
        };
        
        const action = actionMap[operation] || operation;
        return `${baseUrl}?action=${action}${id ? `&id=${id}` : ''}`;
    }
}

// === 서비스별 특화 어댑터 ===

/**
 * GitHub API 어댑터
 */
export class GitHubApiAdapter extends DefaultApiAdapter {
    constructor() {
        super({
            style: 'rest-like',
            primaryKey: 'id'
        });
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        const params: Record<string, any> = {};
        
        // GitHub 스타일 페이지네이션
        params.page = options.page || 1;
        params.per_page = options.limit || 30;
        
        // GitHub 스타일 정렬
        if (options.sort) {
            params.sort = typeof options.sort === 'string' 
                ? options.sort 
                : options.sort[0]?.field;
            params.direction = options.order || 'desc';
        }
        
        // GitHub 검색
        if (options.search || options.q) {
            params.q = options.search || options.q;
        }
        
        // 필터는 쿼리에 포함
        if (options.filter) {
            Object.assign(params, options.filter);
        }
        
        return params;
    }
    
    getHeaders(): Record<string, string> {
        return {
            'Accept': 'application/vnd.github.v3+json'
        };
    }
}

/**
 * Stripe API 어댑터
 */
export class StripeApiAdapter extends DefaultApiAdapter {
    constructor() {
        super({
            style: 'rest-like',
            primaryKey: 'id'
        });
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        const params: Record<string, any> = {};
        
        // Stripe 스타일 페이지네이션 (커서 기반)
        if (options.cursor) {
            params.starting_after = options.cursor;
        }
        params.limit = options.limit || 10;
        
        // Stripe는 created 타임스탬프로 정렬
        if (options.filter?.created) {
            params.created = options.filter.created;
        }
        
        // expand 파라미터
        if (options.expand?.length) {
            params['expand[]'] = options.expand;
        }
        
        return params;
    }
}

/**
 * Slack Web API 어댑터
 */
export class SlackApiAdapter extends RpcApiAdapter {
    constructor() {
        super({
            style: 'rpc',
            primaryKey: 'id'
        });
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        // Slack은 모든 파라미터를 POST body로
        return {
            limit: options.limit || 100,
            cursor: options.cursor,
            // Slack 특유의 파라미터
            inclusive: true,
            ...options.filter
        };
    }
    
    transformEndpoint(baseUrl: string, operation: string): string {
        // Slack API 메서드 매핑
        const methodMap: Record<string, string> = {
            list: 'list',
            get: 'info',
            create: 'create',
            update: 'update',
            delete: 'delete',
            search: 'search'
        };
        
        return `${baseUrl}.${methodMap[operation] || operation}`;
    }
    
    getHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
    }
}

// === 어댑터 팩토리 ===

/**
 * API 어댑터 팩토리
 */
export class ApiAdapterFactory {
    private static adapters = new Map<string, new() => IApiAdapter>([
        ['github', GitHubApiAdapter],
        ['stripe', StripeApiAdapter],
        ['slack', SlackApiAdapter],
    ]);
    
    /**
     * 서비스명으로 어댑터 가져오기
     */
    static get(service: string): IApiAdapter {
        const AdapterClass = this.adapters.get(service.toLowerCase());
        return AdapterClass ? new AdapterClass() : new DefaultApiAdapter();
    }
    
    /**
     * 커스텀 어댑터 등록
     */
    static register(name: string, adapter: new() => IApiAdapter): void {
        this.adapters.set(name.toLowerCase(), adapter);
    }
    
    /**
     * URL로 어댑터 자동 감지
     */
    static async detect(url: string): Promise<IApiAdapter> {
        // URL 패턴으로 서비스 감지
        if (url.includes('api.github.com')) return new GitHubApiAdapter();
        if (url.includes('api.stripe.com')) return new StripeApiAdapter();
        if (url.includes('slack.com/api')) return new SlackApiAdapter();
        
        // API 스타일 감지 시도
        try {
            // OPTIONS 요청으로 API 정보 확인
            const response = await fetch(url, { method: 'OPTIONS' });
            const allow = response.headers.get('Allow');
            
            if (allow?.includes('GET') && allow?.includes('POST') && allow?.includes('PUT')) {
                return new RestfulApiAdapter();
            }
        } catch {}
        
        // 기본 어댑터 반환
        return new DefaultApiAdapter();
    }
}

// === 유틸리티 ===

/**
 * API 스타일 감지 헬퍼
 */
export function detectApiStyle(endpoint: string, sampleResponse?: any): ApiStyle {
    // URL 패턴 분석
    if (/\/api\/v\d+\/\w+/.test(endpoint)) return 'rest';
    if (/\.(list|get|create|update|delete)/.test(endpoint)) return 'rpc';
    if (/\?action=\w+/.test(endpoint)) return 'legacy';
    
    // 응답 구조 분석
    if (sampleResponse) {
        if (sampleResponse._links || sampleResponse.links) return 'rest';  // HAL/JSON:API
        if (sampleResponse.result && sampleResponse.error !== undefined) return 'rpc';  // JSON-RPC
    }
    
    return 'rest-like';
}