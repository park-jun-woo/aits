/**
 * =================================================================
 * Controller.ts - Aits 애플리케이션 로직의 기반
 * =================================================================
 * @description
 * - 모든 컨트롤러 클래스가 상속받아야 하는 추상 클래스입니다.
 * - 컨트롤러의 명확한 생명주기(required, init, onLeave)를 정의하여,
 * AI가 예측 가능한 패턴에 따라 로직을 작성할 수 있도록 돕습니다.
 * - 비즈니스 로직, 데이터 처리, 뷰 제어 등 페이지의 모든 동작을 담당합니다.
 * @author Aits Framework AI (based on MistTS by parkjunwoo)
 * @version 0.1.0
 */

// import type을 사용하여 순환 종속성 문제를 방지합니다.
import type { Aits } from './Aits';
import type { Context } from './Context';

export abstract class Controller {
    // 모든 컨트롤러는 Aits 프레임워크의 메인 인스턴스에 접근할 수 있습니다.
    protected aits: Aits;

    constructor(aitsInstance: Aits) {
        this.aits = aitsInstance;
    }

    /**
     * (생명주기 1) 컨트롤러가 동작하는 데 필요한 리소스를 사전에 선언합니다.
     * 컨트롤러가 처음 로드될 때 단 한 번만 실행됩니다.
     * @param ctx - 초기 컨텍스트 객체
     * @returns 로딩할 리소스의 Promise 배열
     */
    public required?(ctx: Context): Promise<any>[];

    /**
     * (생명주기 2) required가 완료된 후, 컨트롤러가 처음 로드될 때 단 한 번만 실행됩니다.
     * 이 컨트롤러가 담당할 모든 View를 미리 로드하거나, 공통 이벤트 리스너를
     * 설정하는 등의 전체 초기화 작업을 수행합니다.
     * @param ctx - 초기 컨텍스트 객체
     */
    public onLoad?(ctx: Context): Promise<void> | void;

    /**
     * (생명주기 3) 이 컨트롤러에 속한 페이지(Route)에 진입할 때마다 실행됩니다.
     * 라우팅 메소드(GetHome 등)가 실행되기 직전에 호출됩니다.
     * 페이지 진입 시 공통적으로 필요한 작업(예: 로그인 상태 확인)에 적합합니다.
     * @param ctx - 현재 라우트 정보가 포함된 컨텍스트 객체
     */
    public onEnter?(ctx: Context): Promise<void> | void;

    /**
     * (생명주기 5) 사용자가 이 컨트롤러가 담당하는 페이지를 떠날 때 호출됩니다.
     * 이벤트 리스너를 제거하거나, 인터벌을 정리하는 등 메모리 누수 방지를 위한
     * 클린업 작업을 수행합니다.
     */
    public onLeave?(): Promise<void> | void;
}