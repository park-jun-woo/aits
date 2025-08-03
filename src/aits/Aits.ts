/**
 * =================================================================
 * Aits.ts - Aits 프레임워크의 중앙 관제 센터
 * =================================================================
 * @description
 * - 프레임워크의 전체 생명주기, 라우팅, 컨트롤러 관리를 담당합니다.
 * - AI가 애플리케이션의 구조를 쉽게 파악하고 제어할 수 있도록,
 * 명확하고 예측 가능한 패턴을 제공하는 것을 목표로 합니다.
 * @author Aits Framework AI (based on MistTS by parkjunwoo)
 * @version 0.1.0
 */

import Navigo from 'navigo'; // 강력하고 유연한 클라이언트 사이드 라우터
import { Loader } from './Loader'; // 모든 리소스 로딩을 담당 (추후 작성)
import { Context } from './Context'; // 컨트롤러에게 주입될 실행 컨텍스트
import { Controller } from './Controller'; // 모든 컨트롤러의 기반 클래스 (추후 작성)
import { IApiAdapter, DefaultApiAdapter } from './ApiAdapter'; // ApiAdapter import

// 라우팅 규칙을 정의하기 위한 타입
export interface RouteDefinition {
    path: string;
    controllerPath: string;
    methodName: string;
}

export class Aits {
    private navigator: Navigo;
    private loader: Loader;
    public apiAdapter: IApiAdapter; // API 어댑터를 public으로 설정
    private controllers: Map<string, Promise<Controller>>;
    private activeController: Controller | null;
    private isRunning: boolean;

    public constructor() {
        this.navigator = new Navigo('/');
        this.loader = new Loader(this);
        this.apiAdapter = new DefaultApiAdapter(); // 기본 어댑터 설정
        this.controllers = new Map();
        this.activeController = null;
        this.isRunning = false;

        // 404 핸들러 정의
        this.navigator.notFound(() => {
            console.error("404 Not Found: The requested route does not exist.");
            // 여기에 404 페이지를 보여주는 로직을 추가할 수 있습니다.
            // 예: this.navigate('/404');
        });
    }

    /**
     * 프레임워크에서 사용할 API 어댑터를 설정합니다.
     * 이 메소드는 run()을 호출하기 전에 실행되어야 합니다.
     * @param adapter - 사용할 API 어댑터 인스턴스
     */
    public setApiAdapter(adapter: IApiAdapter): void {
        this.apiAdapter = adapter;
    }

    /**
     * 중앙 라우팅 설정 파일을 동적으로 불러와 라우팅 규칙을 설정합니다.
     * AI는 이 메소드를 호출하여 앱의 전체 URL 구조를 정의합니다.
     * @param path - 라우팅 설정 파일의 경로 (e.g., '/app/routes.js')
     */
    public async routes(path: string): Promise<void> {
        try {
            const module = await import(path);
            const routeDefinitions: RouteDefinition[] = module.default;

            if (Array.isArray(routeDefinitions)) {
                routeDefinitions.forEach(route => {
                    this.addRoute(route.path, route.controllerPath, route.methodName);
                });
            }
            // 프레임워크가 이미 실행 중이라면, 새로운 경로를 즉시 적용
            if (this.isRunning) {
                this.navigator.resolve();
            }
        } catch (err) {
            console.error(`[Aits] Error loading routes from ${path}:`, err);
        }
    }

    /**
     * 단일 라우팅 규칙을 추가합니다.
     * @param path - URL 경로 (e.g., '/articles/:id')
     * @param controllerPath - 해당 경로를 처리할 컨트롤러 파일 경로
     * @param methodName - 컨트롤러에서 실행될 메소드 이름
     */
    public addRoute(path: string, controllerPath: string, methodName: string): void {
        this.navigator.on(path, async (match) => {
            try {
                // 1. 이전 컨트롤러 비활성화 (onLeave)
                if (this.activeController && typeof this.activeController.onLeave === 'function') {
                    await this.activeController.onLeave();
                }

                // 2. 새로운 컨트롤러 로드 및 초기화
                let controllerPromise = this.controllers.get(controllerPath);
                if (!controllerPromise) {
                    controllerPromise = this.loadController(controllerPath);
                    this.controllers.set(controllerPath, controllerPromise);
                }
                const controller = await controllerPromise;

                // 3. Context 생성 및 생명주기 메소드 실행
                const context = new Context(this, match);
                this.activeController = controller;

                // 3-1. (생명주기 3) 페이지 진입 시마다 onEnter 실행
                if (typeof controller.onEnter === 'function') {
                    await controller.onEnter(context);
                }
                
                // 3-2. (생명주기 4) 실제 라우트 메소드 실행
                if (typeof controller[methodName] === 'function') {
                    await controller[methodName](context);
                } else {
                    console.error(`[Aits] Method '${methodName}' not found in controller '${controllerPath}'.`);
                }
            } catch (err) {
                console.error(`[Aits] Error processing route '${path}':`, err);
            }
        });
    }

    /**
     * 컨트롤러 파일을 동적으로 로드하고 인스턴스를 생성합니다.
     * 컨트롤러의 `required` 의존성을 먼저 해결한 후 `init`을 호출합니다.
     * @param controllerPath - 컨트롤러 파일 경로
     */
    private async loadController(controllerPath: string): Promise<Controller> {
        try {
            const module = await import(controllerPath);
            const ControllerClass = module.default;
            const controllerInstance = new ControllerClass(this);

            // (생명주기 1) required - 필수 리소스 선언 및 로드
            if (typeof controllerInstance.required === 'function') {
                const requiredResources = controllerInstance.required(new Context(this));
                await Promise.all(requiredResources);
            }

            // (생명주기 2) onLoad - 컨트롤러 최초 로드 시 1회 실행
            if (typeof controllerInstance.onLoad === 'function') {
                await controllerInstance.onLoad(new Context(this));
            }
            return controllerInstance;
        } catch (err) {
            console.error(`[Aits] Failed to load controller: ${controllerPath}`, err);
            this.controllers.delete(controllerPath);
            throw err;
        }
    }

    /**
     * Aits 프레임워크를 시작합니다.
     */
    public run(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.navigator.resolve(); // 현재 URL에 맞는 라우트 실행
        document.body.classList.add('aits-ready');
        console.log('[Aits] Framework is running.');
    }

    /**
     * 페이지 내의 `data-navigo` 속성을 가진 링크들을 갱신합니다.
     */
    public updatePageLinks(): void {
        this.navigator.updatePageLinks();
    }

    /**
     * 프로그래매틱하게 페이지를 이동시킵니다.
     * @param url - 이동할 URL
     */
    public navigate(url: string): void {
        this.navigator.navigate(url);
    }

    // --- Loader 프록시 메소드들 ---
    // 컨트롤러가 this.aits.loader.view() 대신 this.aits.view()로 편하게 호출하도록 제공
    public view(src: string, onLoad?: (el: HTMLElement) => void) {
        return this.loader.view(src, onLoad);
    }

    public model(src: string) {
        return this.loader.model(src);
    }
    
    public json(src: string) {
        return this.loader.json(src);
    }

    public js(src: string) {
        return this.loader.js(src);
    }

    public css(src: string) {
        return this.loader.css(src);
    }
}