/**
 * Slack Web API Adapter
 * @see https://api.slack.com/web
 */

import { IApiAdapter, AitsDataOptions, ApiStyle, RpcApiAdapter } from '../ApiAdapter';

export class SlackApiAdapter extends RpcApiAdapter implements IApiAdapter {
    constructor() {
        super({
            style: 'rpc' as ApiStyle,
            primaryKey: 'id'
        });
    }
    
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        const params: Record<string, any> = {};
        
        // Slack 페이지네이션
        if (options.limit !== undefined) {
            params.limit = Math.min(options.limit, 1000);  // Slack 최대 1000
        }
        
        // 커서 기반 페이지네이션
        if (options.cursor) {
            params.cursor = options.cursor;
        }
        
        // inclusive 파라미터 (Slack 특유)
        params.inclusive = true;
        
        // 채널 ID (대부분의 API에서 필요)
        if (options.filter?.channel) {
            params.channel = options.filter.channel;
        }
        
        // 사용자 ID
        if (options.filter?.user) {
            params.user = options.filter.user;
        }
        
        // 팀 ID
        if (options.filter?.team_id) {
            params.team_id = options.filter.team_id;
        }
        
        // 시간 범위 필터 (메시지 관련)
        if (options.filter?.oldest) {
            params.oldest = this.toSlackTimestamp(options.filter.oldest);
        }
        if (options.filter?.latest) {
            params.latest = this.toSlackTimestamp(options.filter.latest);
        }
        
        // 검색 쿼리
        if (options.search || options.q) {
            params.query = options.search || options.q;
        }
        
        // 정렬 (search.messages에서 사용)
        if (options.sort === 'timestamp') {
            params.sort = 'timestamp';
            params.sort_dir = options.order === 'asc' ? 'asc' : 'desc';
        } else if (options.sort === 'score') {
            params.sort = 'score';  // 관련성 정렬
        }
        
        // 타입 필터
        if (options.filter?.types) {
            params.types = Array.isArray(options.filter.types) 
                ? options.filter.types.join(',')
                : options.filter.types;
        }
        
        // exclude_archived (채널 목록)
        if (options.filter?.exclude_archived !== undefined) {
            params.exclude_archived = options.filter.exclude_archived;
        }
        
        // 기타 필터
        const excludeKeys = ['channel', 'user', 'team_id', 'oldest', 'latest', 'types', 'exclude_archived'];
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
     * 날짜를 Slack 타임스탬프로 변환
     */
    private toSlackTimestamp(date: string | number | Date): string {
        const timestamp = new Date(date).getTime() / 1000;
        return timestamp.toFixed(6);  // Slack은 마이크로초 정밀도 사용
    }
    
    /**
     * Slack API 엔드포인트 변환
     * Slack은 namespace.method 형식 사용
     */
    transformEndpoint(baseUrl: string, operation: string, id?: string | number): string {
        // baseUrl이 이미 메서드를 포함하고 있으면 그대로 사용
        if (baseUrl.includes('.')) {
            return baseUrl;
        }
        
        // 리소스 타입 추출 (예: /conversations -> conversations)
        const resource = baseUrl.split('/').pop() || 'unknown';
        
        // 리소스별 메서드 매핑
        const methodMap: Record<string, Record<string, string>> = {
            conversations: {
                list: 'conversations.list',
                get: 'conversations.info',
                create: 'conversations.create',
                update: 'conversations.rename',
                delete: 'conversations.archive',
                search: 'conversations.list'  // 검색은 list에 query 파라미터로
            },
            users: {
                list: 'users.list',
                get: 'users.info',
                search: 'users.list'
            },
            messages: {
                list: 'conversations.history',
                create: 'chat.postMessage',
                update: 'chat.update',
                delete: 'chat.delete',
                search: 'search.messages'
            },
            files: {
                list: 'files.list',
                get: 'files.info',
                create: 'files.upload',
                delete: 'files.delete',
                search: 'files.list'
            }
        };
        
        const methods = methodMap[resource] || {};
        const method = methods[operation] || `${resource}.${operation}`;
        
        // Slack API는 모든 요청을 단일 엔드포인트로
        return `/api/${method}`;
    }
    
    getHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        };
    }
    
    getPrimaryKeyField(): string {
        // Slack은 리소스마다 다른 ID 필드 사용
        // 일반적으로 'id'지만, 메시지는 'ts', 파일은 'file' 등
        return 'id';
    }
}