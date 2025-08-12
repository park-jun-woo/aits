/**
 * API Adapters Export
 * 
 * 모든 API 어댑터를 중앙에서 관리하고 export합니다.
 */

export { GitHubApiAdapter } from './GitHubApiAdapter';
export { StripeApiAdapter } from './StripeApiAdapter';
export { SlackApiAdapter } from './SlackApiAdapter';
export { AiginApiAdapter } from './AiginApiAdapter';
export type { AiginResponse, AiginErrorResponse } from './AiginApiAdapter';

// 어댑터 레지스트리
import { ApiAdapterFactory } from '../ApiAdapter';
import { GitHubApiAdapter } from './GitHubApiAdapter';
import { StripeApiAdapter } from './StripeApiAdapter';
import { SlackApiAdapter } from './SlackApiAdapter';
import { AiginApiAdapter } from './AiginApiAdapter';

// 기본 어댑터들을 팩토리에 등록
export function registerDefaultAdapters(): void {
    ApiAdapterFactory.register('github', GitHubApiAdapter);
    ApiAdapterFactory.register('stripe', StripeApiAdapter);
    ApiAdapterFactory.register('slack', SlackApiAdapter);
    ApiAdapterFactory.register('aigin', AiginApiAdapter);
}

// 자동 등록 실행
registerDefaultAdapters();