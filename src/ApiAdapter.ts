/**
 * =================================================================
 * ApiAdapter.ts - API 규약 번역기 (어댑터)
 * =================================================================
 * @description
 * - Aits 프레임워크의 표준 요청을 실제 백엔드 API 규약에 맞게 변환합니다.
 * - 이 파일을 수정하여 다양한 종류의 백엔드와 연동할 수 있습니다.
 */

// 1. 각 옵션을 명확한 인터페이스로 분리
export interface AitsPaginationOptions {
    page?: number;
    limit?: number;
}

export interface AitsSortOptions {
    order?: string;
    desc?: boolean;
}

export interface AitsSearchOptions {
    search?: string;
}

/**
 * 2. 분리된 옵션들을 조합한 통합 데이터 요청 옵션.
 * Model의 getPaged와 같은 메소드에서 이 타입을 사용합니다.
 */
export interface AitsDataOptions extends AitsPaginationOptions, AitsSortOptions, AitsSearchOptions {
    filter?: Record<string, any>; // 페이지네이션/정렬/검색 외 모든 기타 옵션
}

// 모든 API 어댑터가 구현해야 하는 인터페이스
export interface IApiAdapter {
    /**
     * Aits 표준 데이터 요청 옵션을 백엔드 API의 쿼리 파라미터로 변환합니다.
     * @param options - Aits 통합 데이터 옵션 객체
     * @returns 백엔드 API가 이해할 수 있는 쿼리 파라미터 객체
     */
    transformDataOptions(options: AitsDataOptions): Record<string, any>;

    /**
     * 데이터 객체에서 Primary Key 필드의 이름을 반환합니다.
     * @returns Primary Key 필드명 (e.g., 'id', 'idx', 'no')
     */
    getPrimaryKeyField(): string;
}

/**
 * 기본 API 어댑터.
 */
export class DefaultApiAdapter implements IApiAdapter {
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        return {
            page: options.page ?? 1,
            limit: options.limit ?? 30,
            order: options.order ?? 'createdAt',
            desc: options.desc ?? true,
            search: options.search,
            ...options.filter, // 필터링 파라미터 추가
        };
    }

    public getPrimaryKeyField(): string {
        return 'id';
    }
}

/**
 * 레거시 또는 다른 규약의 API를 위한 어댑터 예시.
 */
export class LegacyApiAdapter implements IApiAdapter {
    transformDataOptions(options: AitsDataOptions): Record<string, any> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 30;
        
        return {
            offset: (page - 1) * limit,
            length: limit,
            sort_by: options.order ?? 'created_at',
            sort_order: (options.desc ?? true) ? 'DESC' : 'ASC',
            query: options.search,
            ...options.filter, // 필터링 파라미터 추가
        };
    }

    public getPrimaryKeyField(): string {
        return 'item_no';
    }
}