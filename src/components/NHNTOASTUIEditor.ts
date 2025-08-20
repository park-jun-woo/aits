/**
 * =================================================================
 * AitsEditor.ts - TOAST UI Editor 웹 컴포넌트
 * =================================================================
 * @description
 * - NHN TOAST UI Editor를 래핑한 AITS 웹 컴포넌트
 * - 스크롤 시 툴바 자동 플로팅
 * - 에디터 높이 자동 조절
 * - 커스텀 툴바 스타일링 지원
 * @author Aits Framework AI
 * @version 1.0.0
 * @see https://ui.toast.com/tui-editor
 */

import { AitsElement } from './AitsElement';

// TOAST UI Editor 타입 정의
interface ToastUIEditorOptions {
    el?: HTMLElement;
    height?: string | number;
    minHeight?: string;
    initialEditType?: 'markdown' | 'wysiwyg';
    previewStyle?: 'vertical' | 'tab';
    initialValue?: string;
    placeholder?: string;
    events?: {
        load?: () => void;
        change?: () => void;
        focus?: () => void;
        blur?: () => void;
        keydown?: (e: KeyboardEvent) => void;
        keyup?: (e: KeyboardEvent) => void;
    };
    hooks?: any;
    language?: string;
    useCommandShortcut?: boolean;
    usageStatistics?: boolean;
    hideModeSwitch?: boolean;
    toolbarItems?: any[][];
    theme?: string;
    autofocus?: boolean;
    viewer?: boolean;
    plugins?: any[];
    extendedAutolinks?: boolean;
    customHTMLRenderer?: any;
    linkAttributes?: any;
    customHTMLSanitizer?: (html: string) => string;
    previewHighlight?: boolean;
    frontMatter?: boolean;
    widgetRules?: any[];
}

interface ToastUIEditor {
    getMarkdown(): string;
    getHTML(): string;
    setMarkdown(markdown: string, cursorToEnd?: boolean): void;
    setHTML(html: string): void;
    insertText(text: string): void;
    replaceSelection(text: string, start?: any, end?: any): void;
    focus(): void;
    blur(): void;
    hide(): void;
    show(): void;
    reset(): void;
    getSelectedText(): string;
    getSelection(): any;
    setSelection(start: any, end: any): void;
    destroy(): void;
    addHook(type: string, handler: Function): void;
    removeHook(type: string): void;
    isViewer(): boolean;
    isMarkdownMode(): boolean;
    isWysiwygMode(): boolean;
    changeMode(mode: 'markdown' | 'wysiwyg'): void;
    changePreviewStyle(style: 'vertical' | 'tab'): void;
    getHeight(): string;
    setHeight(height: string): void;
    setMinHeight(minHeight: string): void;
    setLanguage(language: string): void;
    setPlaceholder(placeholder: string): void;
    setTheme(theme: string): void;
    on(type: string, handler: Function): void;
    off(type: string): void;
    addCommand(type: string, props: any): void;
    removeCommand(type: string): void;
    exec(name: string, payload?: any): void;
    moveCursorToEnd(): void;
    moveCursorToStart(): void;
    setScrollTop(scrollTop: number): void;
    getScrollTop(): number;
}

/**
 * TOAST UI Editor 웹 컴포넌트
 * <aits-editor></aits-editor>
 */
export class NHNTOASTUIEditor extends AitsElement {
    protected useShadowDOM = false; // Editor는 Light DOM 사용
    
    private editor: ToastUIEditor | null = null;
    private editorContainer: HTMLElement | null = null;
    private toolbarElement: HTMLElement | null = null;
    private isToolbarFloating: boolean = false;
    private scrollObserver: IntersectionObserver | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private editorLoaded: boolean = false;
    private pendingValue: string = '';
    private toolbarSentinel: HTMLElement | null = null;
    
    static get observedAttributes() {
        return [
            'mode', 'preview-style', 'height', 'min-height',
            'placeholder', 'theme', 'language', 'readonly',
            'hide-mode-switch', 'toolbar-sticky', 'auto-height',
            'toolbar-items', 'custom-toolbar'
        ];
    }
    
    protected initialize(): void {
        this.setupStructure();
        this.loadEditor();
    }
    
    /**
     * 기본 구조 설정
     */
    private setupStructure(): void {
        // 에디터 래퍼 생성
        const wrapper = document.createElement('div');
        wrapper.className = 'aits-editor-wrapper';
        wrapper.innerHTML = `
            <div class="toolbar-sentinel"></div>
            <div class="custom-toolbar-container"></div>
            <div class="editor-container"></div>
            <style>${this.getInlineStyles()}</style>
        `;
        
        this.appendChild(wrapper);
        
        this.toolbarSentinel = wrapper.querySelector('.toolbar-sentinel');
        this.editorContainer = wrapper.querySelector('.editor-container');
        
        // 커스텀 툴바 슬롯 설정
        const customToolbar = wrapper.querySelector('.custom-toolbar-container');
        if (customToolbar && this.getBoolAttr('custom-toolbar')) {
            const slot = document.createElement('slot');
            slot.name = 'toolbar';
            customToolbar.appendChild(slot);
        }
    }
    
    /**
     * 인라인 스타일
     */
    private getInlineStyles(): string {
        return `
            .aits-editor-wrapper {
                position: relative;
                width: 100%;
            }
            
            .toolbar-sentinel {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                pointer-events: none;
            }
            
            .custom-toolbar-container:empty {
                display: none;
            }
            
            .custom-toolbar-container {
                border-bottom: 1px solid var(--aits-border-color, #e5e7eb);
                background: var(--aits-bg-surface, white);
            }
            
            /* 에디터 컨테이너 스타일 */
            .editor-container {
                position: relative;
                width: 100%;
            }
            
            /* 툴바 플로팅 스타일 */
            .toolbar-floating {
                position: fixed !important;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000;
                background: white;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                animation: slideDown 0.3s ease;
            }
            
            @keyframes slideDown {
                from {
                    transform: translateY(-100%);
                }
                to {
                    transform: translateY(0);
                }
            }
            
            /* 툴바가 플로팅일 때 에디터 패딩 조정 */
            .editor-container.toolbar-floating-active {
                padding-top: var(--toolbar-height, 52px);
            }
            
            /* TOAST UI Editor 커스텀 스타일 오버라이드 */
            .toastui-editor-defaultUI {
                border: 1px solid var(--aits-border-color, #e5e7eb) !important;
                border-radius: var(--aits-radius-md, 0.5rem);
                overflow: hidden;
            }
            
            .toastui-editor-toolbar {
                background: var(--aits-toolbar-bg, #f9fafb) !important;
                border-bottom: 1px solid var(--aits-border-color, #e5e7eb) !important;
                padding: 0.5rem !important;
            }
            
            .toastui-editor-toolbar button {
                border-radius: var(--aits-radius-sm, 0.25rem) !important;
                transition: all 0.2s ease;
            }
            
            .toastui-editor-toolbar button:hover {
                background: var(--aits-bg-hover, #e5e7eb) !important;
            }
            
            /* 자동 높이 조절 */
            .auto-height .toastui-editor-contents {
                overflow-y: hidden !important;
            }
            
            .auto-height .ProseMirror,
            .auto-height .toastui-editor-md-container .toastui-editor-md-preview,
            .auto-height .CodeMirror {
                min-height: var(--editor-min-height, 300px) !important;
                height: auto !important;
            }
            
            /* 다크 테마 지원 */
            .dark-theme .toastui-editor-defaultUI {
                background: #1a1a1a !important;
                color: #e0e0e0 !important;
            }
            
            .dark-theme .toastui-editor-toolbar {
                background: #2a2a2a !important;
                border-color: #3a3a3a !important;
            }
            
            .dark-theme .toastui-editor-contents {
                background: #1a1a1a !important;
                color: #e0e0e0 !important;
            }
            
            /* 읽기 전용 모드 */
            .readonly .toastui-editor-toolbar {
                opacity: 0.5;
                pointer-events: none;
            }
            
            .readonly .toastui-editor-contents {
                opacity: 0.8;
            }
            
            /* 반응형 스타일 */
            @media (max-width: 768px) {
                .toastui-editor-toolbar {
                    overflow-x: auto;
                    white-space: nowrap;
                }
                
                .toolbar-floating {
                    position: sticky !important;
                    top: 0;
                }
            }
        `;
    }
    
    /**
     * TOAST UI Editor 로드
     */
    private async loadEditor(): Promise<void> {
        try {
            // CDN에서 스크립트 로드
            await this.loadEditorAssets();
            
            // 에디터 인스턴스 생성
            this.createEditorInstance();
            
            this.editorLoaded = true;
            
            // 대기 중인 값이 있으면 설정
            if (this.pendingValue) {
                this.setValue(this.pendingValue);
                this.pendingValue = '';
            }
            
            // 툴바 스티키 설정
            if (this.getBoolAttr('toolbar-sticky')) {
                this.setupToolbarSticky();
            }
            
            // 자동 높이 설정
            if (this.getBoolAttr('auto-height')) {
                this.setupAutoHeight();
            }
            
            this.emit('editor-ready', { editor: this.editor });
            
        } catch (error) {
            console.error('[AitsEditor] Failed to load editor:', error);
            this.emit('editor-error', { error });
        }
    }
    
    /**
     * 에디터 에셋 로드
     */
    private async loadEditorAssets(): Promise<void> {
        // 이미 로드되었는지 확인
        if ((window as any).toastui?.Editor) {
            return;
        }
        
        // CSS 로드
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://uicdn.toast.com/editor/latest/toastui-editor.min.css';
        document.head.appendChild(cssLink);
        
        // 다크 테마 CSS (선택적)
        if (this.getAttr('theme') === 'dark') {
            const darkCssLink = document.createElement('link');
            darkCssLink.rel = 'stylesheet';
            darkCssLink.href = 'https://uicdn.toast.com/editor/latest/theme/toastui-editor-dark.css';
            document.head.appendChild(darkCssLink);
        }
        
        // JavaScript 로드
        await this.loadScript('https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js');
        
        // 플러그인 로드 (선택적)
        const plugins = this.getAttr('plugins', '').split(',').filter(p => p);
        for (const plugin of plugins) {
            await this.loadPlugin(plugin.trim());
        }
    }
    
    /**
     * 스크립트 로드 헬퍼
     */
    private loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }
    
    /**
     * 플러그인 로드
     */
    private async loadPlugin(pluginName: string): Promise<void> {
        const pluginUrls: Record<string, string> = {
            'chart': 'https://uicdn.toast.com/editor-plugin-chart/latest/toastui-editor-plugin-chart.min.js',
            'code-syntax-highlight': 'https://uicdn.toast.com/editor-plugin-code-syntax-highlight/latest/toastui-editor-plugin-code-syntax-highlight-all.min.js',
            'color-syntax': 'https://uicdn.toast.com/editor-plugin-color-syntax/latest/toastui-editor-plugin-color-syntax.min.js',
            'table-merged-cell': 'https://uicdn.toast.com/editor-plugin-table-merged-cell/latest/toastui-editor-plugin-table-merged-cell.min.js',
            'uml': 'https://uicdn.toast.com/editor-plugin-uml/latest/toastui-editor-plugin-uml.min.js'
        };
        
        if (pluginUrls[pluginName]) {
            await this.loadScript(pluginUrls[pluginName]);
        }
    }
    
    /**
     * 에디터 인스턴스 생성
     */
    private createEditorInstance(): void {
        if (!this.editorContainer) return;
        
        const Editor = (window as any).toastui.Editor;
        if (!Editor) {
            throw new Error('TOAST UI Editor not loaded');
        }
        
        // 툴바 아이템 파싱
        const toolbarItems = this.parseToolbarItems();
        
        // 에디터 옵션
        const options: ToastUIEditorOptions = {
            el: this.editorContainer,
            height: this.getAttr('height', 'auto'),
            minHeight: this.getAttr('min-height', '300px'),
            initialEditType: this.getAttr('mode', 'markdown') as 'markdown' | 'wysiwyg',
            previewStyle: this.getAttr('preview-style', 'vertical') as 'vertical' | 'tab',
            placeholder: this.getAttr('placeholder', 'Enter content...'),
            initialValue: this.pendingValue || '',
            usageStatistics: false,
            hideModeSwitch: this.getBoolAttr('hide-mode-switch'),
            language: this.getAttr('language', 'en-US'),
            theme: this.getAttr('theme', 'default'),
            toolbarItems: toolbarItems,
            events: {
                change: () => this.handleChange(),
                focus: () => this.handleFocus(),
                blur: () => this.handleBlur(),
                load: () => this.handleLoad()
            },
            hooks: {
                addImageBlobHook: (blob: Blob, callback: Function) => {
                    this.handleImageUpload(blob, callback);
                }
            }
        };
        
        // 플러그인 추가
        const plugins = this.getPlugins();
        if (plugins.length > 0) {
            options.plugins = plugins;
        }
        
        // 에디터 생성
        this.editor = new Editor(options);
        
        // 툴바 요소 찾기
        this.toolbarElement = this.editorContainer.querySelector('.toastui-editor-toolbar') as HTMLElement;
        
        // 읽기 전용 설정
        if (this.getBoolAttr('readonly')) {
            this.setReadonly(true);
        }
        
        // 자동 높이 클래스 추가
        if (this.getBoolAttr('auto-height')) {
            this.editorContainer.classList.add('auto-height');
        }
    }
    
    /**
     * 툴바 아이템 파싱
     */
    private parseToolbarItems(): any[][] {
        const itemsStr = this.getAttr('toolbar-items', '');
        if (!itemsStr) {
            // 기본 툴바 아이템
            return [
                ['heading', 'bold', 'italic', 'strike'],
                ['hr', 'quote'],
                ['ul', 'ol', 'task', 'indent', 'outdent'],
                ['table', 'image', 'link'],
                ['code', 'codeblock'],
                ['scrollSync']
            ];
        }
        
        try {
            return JSON.parse(itemsStr);
        } catch {
            // 간단한 문자열 포맷 파싱 (comma, pipe 구분)
            return itemsStr.split('|').map(group => 
                group.split(',').map(item => item.trim())
            );
        }
    }
    
    /**
     * 플러그인 가져오기
     */
    private getPlugins(): any[] {
        const plugins: any[] = [];
        const pluginNames = this.getAttr('plugins', '').split(',').filter(p => p);
        
        for (const pluginName of pluginNames) {
            const plugin = this.getPlugin(pluginName.trim());
            if (plugin) {
                plugins.push(plugin);
            }
        }
        
        return plugins;
    }
    
    /**
     * 플러그인 인스턴스 가져오기
     */
    private getPlugin(pluginName: string): any {
        const pluginMap: Record<string, string> = {
            'chart': 'chart',
            'code-syntax-highlight': 'codeSyntaxHighlight',
            'color-syntax': 'colorSyntax',
            'table-merged-cell': 'tableMergedCell',
            'uml': 'uml'
        };
        
        const pluginKey = pluginMap[pluginName];
        if (pluginKey && (window as any).toastui?.Editor?.plugin?.[pluginKey]) {
            return (window as any).toastui.Editor.plugin[pluginKey];
        }
        
        return null;
    }
    
    /**
     * 툴바 스티키 설정
     */
    private setupToolbarSticky(): void {
        if (!this.toolbarElement || !this.toolbarSentinel) return;
        
        // Intersection Observer로 툴바 감지
        this.scrollObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting && !this.isToolbarFloating) {
                        this.enableFloatingToolbar();
                    } else if (entry.isIntersecting && this.isToolbarFloating) {
                        this.disableFloatingToolbar();
                    }
                });
            },
            {
                threshold: 0,
                rootMargin: '-1px 0px 0px 0px'
            }
        );
        
        this.scrollObserver.observe(this.toolbarSentinel);
    }
    
    /**
     * 플로팅 툴바 활성화
     */
    private enableFloatingToolbar(): void {
        if (!this.toolbarElement || !this.editorContainer) return;
        
        // 툴바 높이 저장
        const toolbarHeight = this.toolbarElement.offsetHeight;
        this.style.setProperty('--toolbar-height', `${toolbarHeight}px`);
        
        // 툴바 위치와 너비 계산
        const editorRect = this.editorContainer.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // 툴바를 플로팅으로 변경
        this.toolbarElement.classList.add('toolbar-floating');
        this.toolbarElement.style.left = `${editorRect.left + scrollLeft}px`;
        this.toolbarElement.style.width = `${editorRect.width}px`;
        
        // 에디터 컨테이너 패딩 추가
        this.editorContainer.classList.add('toolbar-floating-active');
        
        this.isToolbarFloating = true;
        this.emit('toolbar-floating', { floating: true });
    }
    
    /**
     * 플로팅 툴바 비활성화
     */
    private disableFloatingToolbar(): void {
        if (!this.toolbarElement || !this.editorContainer) return;
        
        this.toolbarElement.classList.remove('toolbar-floating');
        this.toolbarElement.style.left = '';
        this.toolbarElement.style.width = '';
        
        this.editorContainer.classList.remove('toolbar-floating-active');
        
        this.isToolbarFloating = false;
        this.emit('toolbar-floating', { floating: false });
    }
    
    /**
     * 자동 높이 설정
     */
    private setupAutoHeight(): void {
        if (!this.editor || !this.editorContainer) return;
        
        // ResizeObserver로 컨텐츠 높이 감지
        const contentElement = this.editorContainer.querySelector('.toastui-editor-contents');
        if (!contentElement) return;
        
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const height = entry.contentRect.height;
                this.adjustEditorHeight(height);
            }
        });
        
        this.resizeObserver.observe(contentElement);
        
        // 초기 높이 조정
        this.adjustEditorHeight(300);
    }
    
    /**
     * 에디터 높이 조정
     */
    private adjustEditorHeight(contentHeight: number): void {
        if (!this.editor) return;
        
        const minHeight = parseInt(this.getAttr('min-height', '300'));
        const maxHeight = parseInt(this.getAttr('max-height', '0'));
        
        let newHeight = Math.max(contentHeight + 100, minHeight); // 여유 공간 추가
        
        if (maxHeight > 0) {
            newHeight = Math.min(newHeight, maxHeight);
        }
        
        this.editor.setHeight(`${newHeight}px`);
    }
    
    /**
     * 이미지 업로드 처리
     */
    private async handleImageUpload(blob: Blob, callback: Function): Promise<void> {
        // 커스텀 이미지 업로드 이벤트 발생
        const event = this.emit('image-upload', { 
            blob,
            callback 
        }, { cancelable: true });
        
        if (!event) {
            // 이벤트가 취소되면 기본 동작 수행
            const reader = new FileReader();
            reader.onload = () => {
                callback(reader.result as string, 'image');
            };
            reader.readAsDataURL(blob);
        }
    }
    
    // === 이벤트 핸들러 ===
    
    private handleChange(): void {
        const value = this.getValue();
        this.emit('change', { value });
    }
    
    private handleFocus(): void {
        this.emit('focus');
    }
    
    private handleBlur(): void {
        this.emit('blur');
    }
    
    private handleLoad(): void {
        this.emit('load');
    }
    
    // === Public API ===
    
    /**
     * 마크다운 값 가져오기
     */
    public getValue(): string {
        return this.editor?.getMarkdown() || '';
    }
    
    /**
     * HTML 값 가져오기
     */
    public getHTML(): string {
        return this.editor?.getHTML() || '';
    }
    
    /**
     * 값 설정
     */
    public setValue(value: string, cursorToEnd: boolean = false): void {
        if (!this.editor) {
            this.pendingValue = value;
            return;
        }
        
        this.editor.setMarkdown(value, cursorToEnd);
    }
    
    /**
     * HTML로 값 설정
     */
    public setHTML(html: string): void {
        this.editor?.setHTML(html);
    }
    
    /**
     * 텍스트 삽입
     */
    public insertText(text: string): void {
        this.editor?.insertText(text);
    }
    
    /**
     * 선택 영역 텍스트 교체
     */
    public replaceSelection(text: string): void {
        this.editor?.replaceSelection(text);
    }
    
    /**
     * 포커스
     */
    public focus(): void {
        this.editor?.focus();
    }
    
    /**
     * 블러
     */
    public blur(): void {
        this.editor?.blur();
    }
    
    /**
     * 에디터 리셋
     */
    public reset(): void {
        this.editor?.reset();
    }
    
    /**
     * 선택된 텍스트 가져오기
     */
    public getSelectedText(): string {
        return this.editor?.getSelectedText() || '';
    }
    
    /**
     * 모드 변경
     */
    public changeMode(mode: 'markdown' | 'wysiwyg'): void {
        this.editor?.changeMode(mode);
    }
    
    /**
     * 미리보기 스타일 변경
     */
    public changePreviewStyle(style: 'vertical' | 'tab'): void {
        this.editor?.changePreviewStyle(style);
    }
    
    /**
     * 읽기 전용 설정
     */
    public setReadonly(readonly: boolean): void {
        if (!this.editorContainer) return;
        
        if (readonly) {
            this.editorContainer.classList.add('readonly');
        } else {
            this.editorContainer.classList.remove('readonly');
        }
        
        // 에디터 컨텐츠 편집 가능 여부 설정
        const contentEditable = this.editorContainer.querySelector('.toastui-editor-contents');
        if (contentEditable) {
            (contentEditable as HTMLElement).contentEditable = readonly ? 'false' : 'true';
        }
    }
    
    /**
     * 커맨드 실행
     */
    public exec(command: string, payload?: any): void {
        this.editor?.exec(command, payload);
    }
    
    /**
     * 커스텀 버튼 추가
     */
    public addToolbarButton(options: {
        name: string;
        tooltip: string;
        command?: string;
        text?: string;
        className?: string;
        style?: string;
        handler?: () => void;
    }): void {
        if (!this.editor || !this.toolbarElement) return;
        
        // 커스텀 버튼 생성
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `toastui-editor-toolbar-icons ${options.className || ''}`;
        button.title = options.tooltip;
        
        if (options.text) {
            button.textContent = options.text;
        }
        
        if (options.style) {
            button.style.cssText = options.style;
        }
        
        // 클릭 핸들러
        button.addEventListener('click', () => {
            if (options.handler) {
                options.handler();
            } else if (options.command) {
                this.exec(options.command);
            }
        });
        
        // 툴바에 추가
        const toolbarGroup = this.toolbarElement.querySelector('.toastui-editor-toolbar-group:last-child');
        if (toolbarGroup) {
            toolbarGroup.appendChild(button);
        }
    }
    
    /**
     * 에디터 인스턴스 가져오기
     */
    public getEditor(): ToastUIEditor | null {
        return this.editor;
    }
    
    /**
     * 에디터가 준비되었는지 확인
     */
    public isReady(): boolean {
        return this.editorLoaded && this.editor !== null;
    }
    
    // === 생명주기 ===
    
    protected getTemplate(): string {
        // Light DOM 사용이므로 템플릿 불필요
        return '';
    }
    
    protected onAttributeChange(name: string, oldValue: string | null, newValue: string | null): void {
        if (!this.editor) return;
        
        switch (name) {
            case 'mode':
                this.changeMode(newValue as 'markdown' | 'wysiwyg' || 'markdown');
                break;
            case 'preview-style':
                this.changePreviewStyle(newValue as 'vertical' | 'tab' || 'vertical');
                break;
            case 'height':
                if (newValue) {
                    this.editor.setHeight(newValue);
                }
                break;
            case 'min-height':
                if (newValue) {
                    this.editor.setMinHeight(newValue);
                }
                break;
            case 'placeholder':
                if (newValue) {
                    this.editor.setPlaceholder(newValue);
                }
                break;
            case 'theme':
                if (newValue) {
                    this.editor.setTheme(newValue);
                    if (newValue === 'dark') {
                        this.classList.add('dark-theme');
                    } else {
                        this.classList.remove('dark-theme');
                    }
                }
                break;
            case 'language':
                if (newValue) {
                    this.editor.setLanguage(newValue);
                }
                break;
            case 'readonly':
                this.setReadonly(newValue !== null);
                break;
        }
    }
    
    protected cleanup(): void {
        super.cleanup();
        
        // Observer 정리
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
            this.scrollObserver = null;
        }
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        // 에디터 인스턴스 정리
        if (this.editor) {
            this.editor.destroy();
            this.editor = null;
        }
    }
}