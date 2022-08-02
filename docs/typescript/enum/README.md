# TIL (Typescript에서 enum을 사용하면 안되는 이유)

이번 글은 [TypeScript enum을 사용하지 않는 게 좋은 이유를 Tree-shaking 관점에서 소개합니다.](https://engineering.linecorp.com/ko/blog/typescript-enum-tree-shaking/)를 기반으로 작성되었습니다.


## Goal

- [TypeScript enum을 사용하지 않는 게 좋은 이유를 Tree-shaking 관점에서 소개합니다.](https://engineering.linecorp.com/ko/blog/typescript-enum-tree-shaking/) 이해하기

- Typescript에서 enum을 사용하면 안되는 이유에 대하여 설명할 수 있어야 한다.

- enum을 사용하지 않는다면 다른 대체품은 무엇이 있을까?

<br>

## `Tree-shaking`이란?

enum을 사용하면 안되는 이유를 먼저 알기전에 `Tree-shaking`이라는 개념을 먼저 알아야 한다.

`Tree-shaking`은 죽은 코드(사용 되지 않는 코드)의 제거를 위해 `Javascript`컨텍스트에서 일반적으로 사용되는 용어이다.

`export`를 하였지만 `import`되지 않은 모듈이나 사용되지 않는 코드를 삭제하며 번들을 줄여주는 역할을 한다.

<br>

## enum

enum은 열거형 변수로 정수를 하나로 합칠 때 유용하게 사용될 수 있다. 하지만 `Javascript`에는 없는 기능이며 `Typescript`에서만 사용할 수 있다.

먼저 `Typescript`에서 enum은 아래와 같다.

```ts
enum MAIL_SEARCH_FILTER {
  FROM = "from",
  TO = "to",
}
```

`MAIL_SEARCH_FILTER` enum이 `Javascript`로 트랜스파일되면 아래와 같은 코드로 바뀐다.

```js
"use strict";
var MAIL_SEARCH_FILTER;
(function (MAIL_SEARCH_FILTER) {
  MAIL_SEARCH_FILTER["FROM"] = "from";
  MAIL_SEARCH_FILTER["TO"] = "to";
})(MAIL_SEARCH_FILTER || (MAIL_SEARCH_FILTER = {}));
```

<br>

## `Typescript`에서 enum을 사용하면 `Tree-shaking`이 되지 않는다.

[enum](#enum)에서 말했듯이 enum은 `Typescript`에서만 구현한 기능이기 때문에 트랜스파일 과정을 거치면 **`Javascript`에서는 `IIFE`(즉시 실행 함수)의 모습을 띄게 된다.**

즉 `Javascript`에서 존재하지 않는 것을 구현하기 위해 `Typescript`컴파일러는 `IIFE`(즉시 실행 함수)를 포함한 코드를 생성하게 된다.

번들러 중에는(예를 들어 `Rollup`) `IIFE`를 **사용하지 않은 코드라고 판단을 할 수 없다.** 그렇기 때문에 `Tree-shaking`이 적용되지 않고 번들에 그대로 포함되게 되는 것이다.

<br>

## 그럼 대체품은 뭐가 있을까?

`Union Type`를 사용하면 된다.

### `Union Type`이란?

간단히 이야기하면 유니온 타입(Union Type)이란 `Javascript`의 OR 연산자(||)와 같이 A이거나 B이다 라는 의미의 타입이다.

<br>

먼저 상수를 담을 `object`를 생성 한 후 해당 `object`를 통해 `Union Type`을 생성해주면 된다.

```ts
const MAIL_SEARCH_FILTER = {
  FROM = "from",
  TO = "to",
} as const;

// 1. `keyof typeof MAIL_SEARCH_FILTER`를 통해 `object`의 key를 뽑아온다.
// 2. `typeof MAIL_SEARCH_FILTER[${key}]`을 통해 해당 key에 해당하는 프러퍼티 값을 타입으로 사용
type MAIL_SEARCH_FILTER = typeof MAIL_SEARCH_FILTER[keyof typeof MAIL_SEARCH_FILTER];
const from: MAIL_SEARCH_FILTER = 'from';
```

위와 같이 작성 후 트랜스파일 과정을 거친 `Javascript` 코드는 아래와 같다.

```ts
"use strict";
const MAIL_SEARCH_FILTER = {
    FROM: 'from',
    TO: 'to'
};
const from = 'from';
```

결과적으로 `Typescript`코드에서 정의한 **타입의 이점을 그대로 가져가면서, `Javascript`로 트랜스파일 해도 `IIFE`가 생성되지 않는다.**

그렇기 때문에 만약 해당 타입이 사용되지 않는다면 `Tree-shaking`의 적용 대상이 되어 번들에 포함되지 않게 된다.

<br>

## 그렇다면 `const enum`은?

`Typescript`에서 `const enum`을 사용해 보면 `enum`과 거의 같다고 느껴지겠지만, `enum`의 내용이 트랜스파일할 때 **인라인으로 확장된다는 점이 다르다.** 


`Typescript`에서 `const enum`을 선언하는 방법은 아래와 같다.

```ts
const enum MAIL_SEARCH_FILTER  {
  FROM= "from",
  TO = "to",
};

const from = MAIL_SEARCH_FILTER.FROM
```

위의 코드가 `Javascript`로 트랜스파일 과정을 거치면 아래와 같이 **인라인으로 확장된다.**

```js
"use strict";
;
const from = "from" /* MAIL_SEARCH_FILTER.FROM */;
```

`const enum`은 `Tree-shaking`관점에서 `Union Type`과 같다고 한다. 트랜스파일 되는 것만 봐도 `IIFE`가 생성되지 않는다. 또한 `enum`에 긴 문자열을 할당할 때 트랜스파일 과정에서 **유니코드로 변환 되기 때문에 해당 타입의 값이 수 없이 길어진다.**

추가적으로 단점 2가지가 존재한다.

1. `const enum`은 `Babel`로 전송할 수 없다.

2. `--isolatedModules`가 활성화 된 환경에서 앰비언트 컨텍스트 (일반적으로 `.d.ts`, `declare class`를 의미한다.)에서 선언 된 `const enum`을 다른 모듈에서 액세스 할 경우 **컴파일 오류가 발생한다.**

<br>

## 정리

1. `enum`은 `Typescript`의 기능이며 `Javascript`에는 없는 기능이다.

2. `Javascript`로 트랜스파일 될 때 `enum`은 `IIFE`를 포함한 코드로 변환된다.

3. 변환된 `IIFE`를 포함된 코드는 번들러가 사용여부를 판단하지 못하기 때문에 `Tree-shaking`에서 제외된다.

4. 그렇기 때문에 `enum`대신 `Union Type`를 사용해야 한다.

<br>

## REFERENCES

- https://engineering.linecorp.com/ko/blog/typescript-enum-tree-shaking/

- https://www.kabuku.co.jp/developers/good-bye-typescript-enum