NestJs middleware
===

## middleware란?

웹 개발에서 일반적으로 미들웨어라 함은 `route handler`가 클라이언트 요청을 처리하기 전에 수행되는 컴포넌트를 말한다.
> `route handler`는 웹 프레임워크에서 사용자의 요청을 처리하는 엔드포인트에서 동작을 수행하는 컴포넌트를 말한다.

`NestJs`에서 미들웨어의 기능은 **요청 및 응답** 객체애 대한 액세스 권한을 가질 수 있으며 `next()`라는 함수를 인자로 받아 `route handler`를 실행시킬 수도 있습니다. 

<img src = https://docs.nestjs.com/assets/Middlewares_1.png>

<br>

`NestJs`의 미들웨어는 기본적으로 **익스프레스** 미들웨어와 동일하다. 익스프레스 공식 문서에 다음과 같은 동작을 수행할 수 있다고 적혀 있다.

- 어떤 형태의 코드라도 수행할 수 있다.

- 요청과 응답에 변형을 가할 수 있다.

- 요청-응답 주기를 끝낼 수 있다.

- 여려 개의 미들웨어를 사용한다면 `next()`로 호출 스택상 다음 미들웨어에게 제어권을 전달할 수 있다.

<br>

미들웨어를 활용하여 다음과 같은 작업들을 수행할 수 있다.

- 쿠키 파싱

- 세션 관리

- 인증/인가 (`NestJs`는 인가를 구현할 때 `Guard`사용을 권장하고 있다.)

- 본문 파싱

그 외 원하는 기능이 있다면 커스텀 미들웨어를 작성하여 사용하면 된다.

<br>

## middleware 만들기

`NestJs`에서 미들웨어를 만들 때 함수로 작성하거나 `NestMiddleware` 인터페이스를 구현한 클래스로 작성할 수 있다.

간단하게 요청이 들어오고 `next()` 실행 전,후 로 logging을 하는 미들웨어이다.

```ts
@Injectable()
export class AppMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AppMiddleware.name)

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log('request가 들어왔습니다.')
    next();
  }
}
```

<br>

이 후 해당 미들웨어를 사용하는 모듈 class에서 `NestModule`를 구현하여 `NestModule`의 `configure`함수를 통해 미들웨어를 설정할 수 있다.

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AppMiddleware)
      .forRoutes('/')
  }
}
```

이 후 서버로 요청을 보내면 아래와 같은 로그가 찍히는 것을 확인할 수 있을 것이다.

```ts
[Nest] 2217  - 2022. 04. 16. 오전 11:19:44     LOG [AppMiddleware] request가 들어왔습니다.
```

<br>

### `MiddlewareConsumer` 알아보기

`configure`의 파라미터로 받는 `MiddlewareConsumer` 객체를 이용하여 미들웨어를 어디에 적용할 지 관리할 수 있다. `MiddlewareConsumer`는 아래와 같다.

```ts
export interface MiddlewareConsumer {
    apply(...middleware: (Type<any> | Function)[]): MiddlewareConfigProxy;
}
```

정리하자면 `configure`의 인자로 `MiddlewareConsumer` 인터페이스를 구현한 객체가 들어오고 해당 객체의 `apply`를 통하여 지정을 할 수 있게 된는 것이다.

위의 `apply`를 보면 배열을 받게되는데 미들웨어 함수 혹은 미들웨어 클래스를 나열해주면 된다. 이 때 **나열 된 순서대로 적용이 된다.**

이렇게 등록이 끝나면 `MiddlewareConfigProxy`를 리턴하게 되는데 [위에서](#middleware-만들기) 사용한 `forRoute()`를 리턴되는 `MiddlewareConfigProxy`로 인해 체이닝이 가능한 것이다.

<br>

### `MiddlewareConfigProxy` 알아보기

`MiddlewareConfigProxy`인터페이스는 아래와 같은 메서드를 가지고 있다.

```ts
export interface MiddlewareConfigProxy {
    exclude(...routes: (string | RouteInfo)[]): MiddlewareConfigProxy;
    forRoutes(...routes: (string | Type<any> | RouteInfo)[]): MiddlewareConsumer;
}
```

`exclude`는 미들웨어를 적용하지 않을 대상을 지정할 수 있으며 `forRoutes`는 미들웨어를 적용할 대상을 지정할 수 있다.

파라미터 타입으로는 문자열, 타입, `RouteInfo`를 배열로 받고 있으며 `RouteInfo`는 아래와 같은 인터페이스 타입이다. 

```ts
export interface RouteInfo {
    path: string;
    method: RequestMethod;
}
```

<br>













