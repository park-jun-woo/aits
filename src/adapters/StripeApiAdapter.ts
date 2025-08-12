/**
 * Stripe API Adapter
 * @see https://stripe.com/docs/api
 */

import { IApiAdapter, AitsDataOptions, ApiStyle, DefaultApiAdapter } from '../ApiAdapter';

export class StripeApiAdapter extends DefaultApiAdapter implements IApiAdapter {
    constructor() {
        super({
            style: 'rest-like' as ApiStyle,
            primaryKey: 'id'
        });
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        const params: Record<string, any> = {};
        
        // Stripe 페이지네이션 (커서 기반)
        if (options.limit !== undefined) {
            params.limit = Math.min(options.limit, 100);  // Stripe는 최대 100
        }
        
        // 커서 기반 페이지네이션
        if (options.cursor) {
            // Stripe는 starting_after 또는 ending_before 사용
            if (options.filter?.direction === 'before') {
                params.ending_before = options.cursor;
            } else {
                params.starting_after = options.cursor;
            }
        } else if (options.page && options.page > 1 && options.filter?.last_id) {
            // 페이지 번호를 커서로 변환 (last_id 필요)
            params.starting_after = options.filter.last_id;
        }
        
        // Stripe 날짜 필터 (created, updated 등)
        if (options.filter?.created) {
            params.created = this.transformDateFilter(options.filter.created);
        }
        if (options.filter?.updated) {
            params.updated = this.transformDateFilter(options.filter.updated);
        }
        
        // expand 파라미터 (관계 데이터 포함)
        if (options.expand?.length) {
            // Stripe는 'expand[]' 형식 사용
            params['expand[]'] = options.expand;
        }
        
        // 이메일 검색 (Customer API)
        if (options.search && options.filter?.type === 'customer') {
            params.email = options.search;
        } else if (options.search) {
            // 일반 검색은 query 파라미터 사용 (Search API)
            params.query = options.search;
        }
        
        // 상태 필터
        if (options.filter?.status) {
            params.status = options.filter.status;
        }
        
        // 통화 필터
        if (options.filter?.currency) {
            params.currency = options.filter.currency.toLowerCase();
        }
        
        // 메타데이터 필터
        if (options.filter?.metadata) {
            Object.entries(options.filter.metadata).forEach(([key, value]) => {
                params[`metadata[${key}]`] = value;
            });
        }
        
        // 기타 필터 (특수 키 제외)
        const excludeKeys = ['direction', 'last_id', 'created', 'updated', 'type', 'status', 'currency', 'metadata'];
        if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
                if (!excludeKeys.includes(key) && value !== undefined) {
                    params[key] = value;
                }
            });
        }
        
        return params;
    }
    
    /**
     * Stripe 날짜 필터 변환
     */
    private transformDateFilter(dateFilter: any): any {
        if (typeof dateFilter === 'string' || typeof dateFilter === 'number') {
            // 단일 날짜는 Unix timestamp로
            return Math.floor(new Date(dateFilter).getTime() / 1000);
        } else if (typeof dateFilter === 'object') {
            // 범위 쿼리 지원 {gte: '2024-01-01', lte: '2024-12-31'}
            const result: any = {};
            if (dateFilter.gte) result.gte = Math.floor(new Date(dateFilter.gte).getTime() / 1000);
            if (dateFilter.gt) result.gt = Math.floor(new Date(dateFilter.gt).getTime() / 1000);
            if (dateFilter.lte) result.lte = Math.floor(new Date(dateFilter.lte).getTime() / 1000);
            if (dateFilter.lt) result.lt = Math.floor(new Date(dateFilter.lt).getTime() / 1000);
            return result;
        }
        return dateFilter;
    }
    
    getHeaders(): Record<string, string> {
        return {
            'Stripe-Version': '2023-10-16'  // API 버전 고정
        };
    }
    
    /**
     * Stripe API 엔드포인트 변환
     */
    transformEndpoint(baseUrl: string, operation: string, id?: string | number): string {
        switch (operation) {
            case 'search':
                // Stripe Search API는 /v1/resource/search 형식
                return `${baseUrl}/search`;
            default:
                // 부모 클래스의 기본 구현 사용
                return super.transformEndpoint(baseUrl, operation, id);
        }
    }
}