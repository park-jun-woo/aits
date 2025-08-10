import { AitsElement } from './AitsElement';

/**
 * <article is="aits-article">: 단일 데이터(게시물 등)를 표시하는 컴포넌트.
 * Controller가 직접 data 프로퍼티를 통해 데이터를 주입합니다.
 * 모든 데이터 처리 및 렌더링 로직은 부모 클래스인 AitsElement로부터 상속받습니다.
 */
class AitsArticle extends AitsElement {
    // 이제 아무런 추가 로직이 필요 없습니다.
    // data 속성과 render 메소드는 AitsElement에 이미 구현되어 있습니다.
}

customElements.define('aits-article', AitsArticle, { extends: 'article' });