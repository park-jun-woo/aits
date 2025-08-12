/**
 * =================================================================
 * AitsSort - 정렬 컴포넌트
 * =================================================================
 * @description
 * - 데이터 정렬을 위한 인터랙션 컴포넌트
 * - 여러 개를 조합하여 다중 정렬 지원
 * - Controller에서 정렬 상태를 쉽게 조회 가능
 * @author Aits Framework AI
 * @version 1.0.0
 */

import { AitsElement } from './AitsElement';

// 정렬 방향 타입
export type SortDirection = 'asc' | 'desc' | 'none';

// 정렬 상태 인터페이스
export interface SortState {
    field: string;
    direction: SortDirection;
    priority: number;  // 다중 정렬 시 우선순위
}

// 정렬 변경 이벤트
export interface SortChangeEvent {
    field: string;
    direction: SortDirection;
    previousDirection: SortDirection;
    isMultiSort: boolean;
}

/**
 * AitsSort - 정렬 버튼 컴포넌트
 * <button is="aits-sort"> 또는 <th is="aits-sort">
 */
export class AitsSort extends AitsElement {
    private static sortRegistry: Map<string, AitsSort> = new Map();
    private static activeSorts: Map<string, SortState> = new Map();
    private static sortPriority: number = 0;
    
    private field: string = '';
    private direction: SortDirection = 'none';
    private allowNone: boolean = false;
    private isMultiSort: boolean = false;
    private priority: number = 0;
    
    static get observedAttributes() {
        return ['field', 'direction', 'allow-none', 'multi-sort', 'group'];
    }
    
    protected initialize(): void {
        this.field = this.getAttr('field', '');
        this.direction = this.getAttr('direction', 'none') as SortDirection;
        this.allowNone = this.getBoolAttr('allow-none');
        this.isMultiSort = this.getBoolAttr('multi-sort');
        
        if (this.field) {
            // 레지스트리에 등록
            const group = this.getGroup();
            const key = `${group}:${this.field}`;
            AitsSort.sortRegistry.set(key, this);
            
            // 초기 상태가 none이 아니면 활성 정렬에 추가
            if (this.direction !== 'none') {
                this.priority = ++AitsSort.sortPriority;
                AitsSort.activeSorts.set(key, {
                    field: this.field,
                    direction: this.direction,
                    priority: this.priority
                });
            }
        }
    }
    
    protected getTemplate(): string {
        const icons = this.getSortIcons();
        const isActive = this.direction !== 'none';
        
        return `
            <button class="sort-button ${isActive ? 'active' : ''} direction-${this.direction}" 
                    part="button"
                    aria-label="Sort by ${this.field}"
                    aria-pressed="${isActive}">
                <span class="sort-content" part="content">
                    <slot>${this.field}</slot>
                </span>
                <span class="sort-indicator" part="indicator">
                    ${icons[this.direction]}
                </span>
                ${this.isMultiSort && this.priority > 0 ? `
                    <span class="sort-priority" part="priority">${this.priority}</span>
                ` : ''}
            </button>
        `;
    }
    
    protected getStyles(): string {
        return `
            :host {
                display: inline-block;
            }
            
            .sort-button {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                background: transparent;
                border: none;
                padding: 0.5rem 0.75rem;
                cursor: pointer;
                font: inherit;
                color: inherit;
                border-radius: var(--aits-radius-sm, 0.25rem);
                transition: all 0.2s ease;
                position: relative;
                user-select: none;
            }
            
            .sort-button:hover {
                background: var(--aits-bg-hover, rgba(0, 0, 0, 0.05));
            }
            
            .sort-button.active {
                color: var(--aits-color-primary, #3b82f6);
                font-weight: 600;
            }
            
            .sort-content {
                flex: 1;
            }
            
            .sort-indicator {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 1.25rem;
                height: 1.25rem;
                font-size: 0.875rem;
                opacity: 0.5;
                transition: all 0.2s ease;
            }
            
            .sort-button.active .sort-indicator {
                opacity: 1;
            }
            
            .direction-asc .sort-indicator {
                transform: rotate(0deg);
            }
            
            .direction-desc .sort-indicator {
                transform: rotate(180deg);
            }
            
            .sort-priority {
                position: absolute;
                top: -0.25rem;
                right: -0.25rem;
                background: var(--aits-color-primary, #3b82f6);
                color: white;
                width: 1.25rem;
                height: 1.25rem;
                border-radius: 50%;
                font-size: 0.75rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            
            /* 테이블 헤더 스타일 */
            :host(th) .sort-button {
                width: 100%;
                justify-content: space-between;
                padding: 0.75rem 1rem;
                text-align: left;
            }
            
            :host(th[align="center"]) .sort-button {
                justify-content: center;
            }
            
            :host(th[align="right"]) .sort-button {
                justify-content: flex-end;
                flex-direction: row-reverse;
            }
        `;
    }
    
    protected afterRender(): void {
        const button = this.$('.sort-button') as HTMLButtonElement;
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSort(e);
            });
        }
    }
    
    private handleSort(event: Event): void {
        const previousDirection = this.direction;
        const ctrlKey = (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey;
        
        // 다중 정렬 모드 확인
        const isMulti = this.isMultiSort || ctrlKey;
        
        if (!isMulti) {
            // 단일 정렬: 다른 모든 정렬 초기화
            this.clearOtherSorts();
        }
        
        // 다음 정렬 방향 결정
        this.direction = this.getNextDirection(this.direction);
        
        // 상태 업데이트
        this.updateSortState();
        
        // 렌더링 업데이트
        this.render();
        
        // 이벤트 발생
        this.emit('sort-change', {
            field: this.field,
            direction: this.direction,
            previousDirection,
            isMultiSort: isMulti
        } as SortChangeEvent);
        
        // 전역 이벤트 발생 (다른 컴포넌트와 동기화)
        this.emitGlobalSortEvent();
    }
    
    private getNextDirection(current: SortDirection): SortDirection {
        if (this.allowNone) {
            // none -> asc -> desc -> none
            switch (current) {
                case 'none': return 'asc';
                case 'asc': return 'desc';
                case 'desc': return 'none';
            }
        } else {
            // asc <-> desc
            return current === 'asc' ? 'desc' : 'asc';
        }
    }
    
    private updateSortState(): void {
        const group = this.getGroup();
        const key = `${group}:${this.field}`;
        
        if (this.direction === 'none') {
            // 정렬 제거
            AitsSort.activeSorts.delete(key);
            this.priority = 0;
        } else {
            // 정렬 추가/업데이트
            if (!AitsSort.activeSorts.has(key)) {
                this.priority = ++AitsSort.sortPriority;
            }
            
            AitsSort.activeSorts.set(key, {
                field: this.field,
                direction: this.direction,
                priority: this.priority
            });
        }
        
        // 우선순위 재정렬
        this.reorderPriorities();
    }
    
    private clearOtherSorts(): void {
        const group = this.getGroup();
        const currentKey = `${group}:${this.field}`;
        
        // 같은 그룹의 다른 정렬 초기화
        AitsSort.sortRegistry.forEach((sort, key) => {
            if (key.startsWith(`${group}:`) && key !== currentKey) {
                sort.direction = 'none';
                sort.priority = 0;
                sort.render();
                AitsSort.activeSorts.delete(key);
            }
        });
        
        // 우선순위 리셋
        AitsSort.sortPriority = 0;
    }
    
    private reorderPriorities(): void {
        const group = this.getGroup();
        const groupSorts = Array.from(AitsSort.activeSorts.entries())
            .filter(([key]) => key.startsWith(`${group}:`))
            .sort((a, b) => a[1].priority - b[1].priority);
        
        // 우선순위 재할당
        groupSorts.forEach(([key, state], index) => {
            state.priority = index + 1;
            const sort = AitsSort.sortRegistry.get(key);
            if (sort) {
                sort.priority = state.priority;
            }
        });
    }
    
    private emitGlobalSortEvent(): void {
        const group = this.getGroup();
        const sorts = this.getGroupSorts(group);
        
        // 그룹 전체 정렬 상태 이벤트
        document.dispatchEvent(new CustomEvent('aits:sort-update', {
            detail: {
                group,
                sorts,
                changedField: this.field
            },
            bubbles: true
        }));
    }
    
    private getGroup(): string {
        return this.getAttr('group', 'default');
    }
    
    private getSortIcons(): Record<SortDirection, string> {
        return {
            none: '<span class="icon-none">⇅</span>',
            asc: '<span class="icon-asc">↑</span>',
            desc: '<span class="icon-desc">↓</span>'
        };
    }
    
    // === 정적 메서드 (Controller에서 사용) ===
    
    /**
     * 특정 그룹의 현재 정렬 상태 가져오기
     */
    public static getSorts(group: string = 'default'): SortState[] {
        const sorts: SortState[] = [];
        
        AitsSort.activeSorts.forEach((state, key) => {
            if (key.startsWith(`${group}:`)) {
                sorts.push({ ...state });
            }
        });
        
        return sorts.sort((a, b) => a.priority - b.priority);
    }
    
    /**
     * 정렬 상태를 쿼리 파라미터로 변환
     */
    public static toQueryParams(group: string = 'default'): Record<string, string> {
        const sorts = this.getSorts(group);
        const params: Record<string, string> = {};
        
        if (sorts.length === 1) {
            // 단일 정렬
            params.sort = sorts[0].field;
            params.order = sorts[0].direction;
        } else if (sorts.length > 1) {
            // 다중 정렬
            params.sort = sorts.map(s => `${s.field}:${s.direction}`).join(',');
        }
        
        return params;
    }
    
    /**
     * 정렬 상태를 API 형식으로 변환
     */
    public static toApiFormat(group: string = 'default'): Array<{field: string, order: string}> {
        return this.getSorts(group).map(sort => ({
            field: sort.field,
            order: sort.direction === 'asc' ? 'ASC' : 'DESC'
        }));
    }
    
    /**
     * 프로그래매틱하게 정렬 설정
     */
    public static setSort(
        field: string, 
        direction: SortDirection, 
        group: string = 'default'
    ): void {
        const key = `${group}:${field}`;
        const sort = this.sortRegistry.get(key);
        
        if (sort) {
            sort.direction = direction;
            sort.updateSortState();
            sort.render();
            sort.emitGlobalSortEvent();
        }
    }
    
    /**
     * 모든 정렬 초기화
     */
    public static clearAll(group: string = 'default'): void {
        AitsSort.sortRegistry.forEach((sort, key) => {
            if (key.startsWith(`${group}:`)) {
                sort.direction = 'none';
                sort.priority = 0;
                sort.render();
            }
        });
        
        // 활성 정렬 제거
        Array.from(AitsSort.activeSorts.keys()).forEach(key => {
            if (key.startsWith(`${group}:`)) {
                AitsSort.activeSorts.delete(key);
            }
        });
        
        AitsSort.sortPriority = 0;
    }
    
    /**
     * 특정 필드의 정렬 상태 가져오기
     */
    public static getSortDirection(
        field: string, 
        group: string = 'default'
    ): SortDirection {
        const key = `${group}:${field}`;
        const state = this.activeSorts.get(key);
        return state?.direction || 'none';
    }
    
    // === 인스턴스 메서드 ===
    
    /**
     * 현재 정렬 상태 가져오기
     */
    public getSortState(): SortState | null {
        if (this.direction === 'none') return null;
        
        return {
            field: this.field,
            direction: this.direction,
            priority: this.priority
        };
    }
    
    /**
     * 정렬 방향 설정
     */
    public setDirection(direction: SortDirection): void {
        this.direction = direction;
        this.updateSortState();
        this.render();
    }
    
    /**
     * 정렬 토글
     */
    public toggle(): void {
        this.direction = this.getNextDirection(this.direction);
        this.updateSortState();
        this.render();
    }
    
    /**
     * 정렬 초기화
     */
    public reset(): void {
        this.direction = 'none';
        this.priority = 0;
        this.updateSortState();
        this.render();
    }
    
    // === 헬퍼 메서드 ===
    
    private getGroupSorts(group: string): SortState[] {
        return AitsSort.getSorts(group);
    }
    
    // === 정리 ===
    
    protected cleanup(): void {
        super.cleanup();
        
        // 레지스트리에서 제거
        const group = this.getGroup();
        const key = `${group}:${this.field}`;
        AitsSort.sortRegistry.delete(key);
        AitsSort.activeSorts.delete(key);
    }
}

/**
 * AitsSortGroup - 정렬 그룹 컨테이너 (선택적)
 * 여러 정렬 버튼을 그룹으로 관리
 */
export class AitsSortGroup extends AitsElement {
    static get observedAttributes() {
        return ['group', 'multi-sort', 'allow-none'];
    }
    
    protected getTemplate(): string {
        return `
            <div class="sort-group" part="container">
                <slot></slot>
                ${this.getBoolAttr('show-clear') ? `
                    <button class="sort-clear" part="clear">Clear All</button>
                ` : ''}
            </div>
        `;
    }
    
    protected getStyles(): string {
        return `
            .sort-group {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .sort-clear {
                margin-left: auto;
                padding: 0.5rem 1rem;
                background: var(--aits-bg-muted, #f3f4f6);
                border: none;
                border-radius: var(--aits-radius-sm, 0.25rem);
                cursor: pointer;
                font-size: 0.875rem;
                transition: all 0.2s ease;
            }
            
            .sort-clear:hover {
                background: var(--aits-bg-hover, #e5e7eb);
            }
        `;
    }
    
    protected afterRender(): void {
        // 그룹 속성을 자식 정렬 버튼에 전파
        const group = this.getAttr('group', 'default');
        const multiSort = this.getBoolAttr('multi-sort');
        const allowNone = this.getBoolAttr('allow-none');
        
        this.querySelectorAll('[is="aits-sort"]').forEach(sort => {
            if (!sort.hasAttribute('group')) {
                sort.setAttribute('group', group);
            }
            if (multiSort && !sort.hasAttribute('multi-sort')) {
                sort.setAttribute('multi-sort', '');
            }
            if (allowNone && !sort.hasAttribute('allow-none')) {
                sort.setAttribute('allow-none', '');
            }
        });
        
        // Clear 버튼 이벤트
        const clearBtn = this.$('.sort-clear') as HTMLButtonElement;
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                AitsSort.clearAll(group);
                this.emit('sort-clear', { group });
            });
        }
    }
    
    /**
     * 현재 그룹의 정렬 상태 가져오기
     */
    public getSorts(): SortState[] {
        const group = this.getAttr('group', 'default');
        return AitsSort.getSorts(group);
    }
}