/**
 * GitHub API Adapter
 * @see https://docs.github.com/en/rest
 */

import { IApiAdapter, AitsDataOptions, ApiStyle, DefaultApiAdapter } from '../ApiAdapter';

export class GitHubApiAdapter extends DefaultApiAdapter implements IApiAdapter {
    constructor() {
        super({
            style: 'rest-like' as ApiStyle,
            primaryKey: 'id'
        });
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        const params: Record<string, any> = {};
        
        // GitHub 스타일 페이지네이션
        if (options.page !== undefined) {
            params.page = options.page;
        }
        if (options.limit !== undefined) {
            params.per_page = options.limit;  // GitHub은 per_page 사용
        }
        
        // GitHub 스타일 정렬
        if (options.sort) {
            if (typeof options.sort === 'string') {
                params.sort = options.sort;
                params.direction = options.order || 'desc';
            } else if (Array.isArray(options.sort) && options.sort.length > 0) {
                // GitHub은 단일 정렬만 지원
                params.sort = options.sort[0].field;
                params.direction = options.sort[0].order || 'desc';
            }
        }
        
        // GitHub 검색 (Search API)
        if (options.search || options.q) {
            params.q = options.search || options.q;
        }
        
        // 상태 필터 (GitHub 특유)
        if (options.filter?.state) {
            params.state = options.filter.state;  // 'open', 'closed', 'all'
        }
        
        // 라벨 필터
        if (options.filter?.labels) {
            params.labels = Array.isArray(options.filter.labels) 
                ? options.filter.labels.join(',')
                : options.filter.labels;
        }
        
        // since 파라미터 (날짜 필터)
        if (options.filter?.since) {
            params.since = options.filter.since;
        }
        
        // 기타 필터
        const excludeKeys = ['state', 'labels', 'since'];
        if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
                if (!excludeKeys.includes(key) && value !== undefined) {
                    params[key] = value;
                }
            });
        }
        
        return params;
    }
    
    getHeaders(): Record<string, string> {
        return {
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }
    
    /**
     * GitHub API 엔드포인트 변환
     */
    transformEndpoint(baseUrl: string, operation: string, id?: string | number): string {
        switch (operation) {
            case 'search':
                // GitHub Search API는 별도 경로
                return baseUrl.replace('/repos/', '/search/');
            default:
                // 부모 클래스의 기본 구현 사용
                return super.transformEndpoint(baseUrl, operation, id);
        }
    }
}