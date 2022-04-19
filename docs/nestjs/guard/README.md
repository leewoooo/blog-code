NestJs Guard
===

예제 코드는 [Github](https://github.com/leewoooo/blog-code/tree/main/guard-study)에 있습니다:)

## Goal

- `NestJs`에서 Guard의 사용법을 알아보기.

	- ExcutionContext

	- custom metadata

- `NestJs` Guard 만들어보기.

<br>

## Guard란?

가드는 `@Injectable()` 데코레이터를 사용하며 `CanActivate` 인터페이스를 구현한 클래스이다.

`@Injectable()`를 사용한 이유는 인스턴스 대신 타입을 전달하여 사용하고, 인스턴스화에 대한 책임은 프레임워크에 남겨두고 의존성을 주입가능하게 하기 위해서이다. (`new`를 이용하여 인스턴스를 넣어줄 수도 있으며 자세한 건 아래에서 설명하겠다.)

<img src = https://docs.nestjs.com/assets/Guards_1.png>

<br>

가드는 단일 책임을 가지며 특정한 상황들(permissions, role, ACLs...)에 따라, 주어진 request가 라우트 핸들러에 의해 처리 여부를 결정한다. `Express`에서는 주로 미들웨어로 처리를 하였다.

미들웨어는 주로 **인증**에 관련된 작업을 사용할 때 사용하며 `NestJs`에서 **인가**에 관련된 작업은 가드를 통해 이뤄진다.

공식문서에 의하면 미들웨어는 `next()`가 호출 된 후 **어떠한 라우트 핸들러가 실행될 지를 모른다.** 하지만 가드는 `ExcutionContext`를 사용할 수 있기 때문에 **다음에 어떠한 라우트 핸들러가 실행되는지 정확하게 알 수 있다.**

>HINT<br>Guards are executed after each middleware, but before any interceptor or pipe.<br>(가드는 미들웨어 이후에 실행되며 인터셉터와 파이프 이전에 실행된다.)

<br>

### CanActive 인터페이스

`CanActive` 인터페이스의 구조는 아래와 같다.

```ts
export interface CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
}
```
`canActivate`라는 메소드가 있으며 파라미터로 **실행 컨텍스트(ExecutionContext)**를 받고 있다.

<br>

## 실행 컨텍스트(ExecutionContext)

`canActivate` 메소드의 파라미터로 받는 실행 컨텍스트는 `ArgumentHost`를 상속받고 있다.

```ts
export interface ArgumentsHost {
    getArgs<T extends Array<any> = any[]>(): T;
    getArgByIndex<T = any>(index: number): T;
    switchToRpc(): RpcArgumentsHost;
    switchToHttp(): HttpArgumentsHost;
    switchToWs(): WsArgumentsHost;
    getType<TContext extends string = ContextType>(): TContext;
}

export interface ExecutionContext extends ArgumentsHost {
    getClass<T = any>(): Type<T>;
    getHandler(): Function;
}
```

`ArgumentsHost`는 [이전 filter](https://velog.io/@dev_leewoooo/NestJs-Filter)를 사용할 때 보았을 것이다. 

`ExecutionContext`는 `ArgumentsHost`를 상속 받았기 때문에 각 통신 프로토콜에 맞는 `switch` 메소드를 통해 `Request, Response, next()`를 얻어올 수 있다.

여기서 중요하게 보아야 할 점은 `ExecutionContext`가 가지고 있는 method이다. 

`getClass`는 클라이언트로 요청이 들어왔을 때 **처리할 수 있는 라우트 핸들러를 가진 컨트롤러에 대한 정보를 가지고 있으며**, `getHandler`는 클라이언트로 들어온 **요청을 처리하는 라우트 핸들러에 대한 정보를 가지고 있다.**

그렇기 때문에 **미들웨어와 달리 이 후 실행되는 컨트롤러나 라우트 핸들러에 대한 정보를 알 수 있게 되는 것이다.**

<br>

## 커스텀 가드 만들기 (role based)

위에서 작성한 내용들을 통해 커스텀 가드는 쉽게 만들 수 있다.

```ts
@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true
  }
}
```

위와 같이 작성한 커스텀 가드를 적용하는 방법은 [파이프 적용 레벨](https://velog.io/@dev_leewoooo/NestJs-Pipe#binding-pipes)과 크게 다르지 않다. `핸들러-레벨`에 적용하여 예제 코드를 작성해보겠다.

```ts
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @UseGuards(RoleGuard)
  getHello(): string {
    return this.appService.getHello();
  }
}
```

위와 같이 `@UseGuards` 데코레이터를 이용하여 가드를 적용시킬 수 있으며 현재 해당 엔드포인트로 요청을 보내면 `RoleGuard`에서 `true`를 반환하고 있어 아무런 일이 일어나지 않을 것이다.

하지만! `false`값을 반환하게 되면 아래와 같은 메세지를 클라이언트가 받을 수 있다.

```json
{
    "statusCode": 403,
    "message": "Forbidden resource",
    "error": "Forbidden"
}
```

만약 위와 같은 메세지를 클라이언트에게 전달하는 것이 아니라 커스텀 하고 싶다면 **인가를 실패하는 경우 새로운 예외를 `throw`한 후 예외 필터에서 처리하여 응답을 조작할 수 있다.**


위와 같이 가드를 만들 수 있지만 공식문서에 의하면 **스마트한 방법은 아니다.** 가드의 가장 큰 장점은 위에서도 설명하였듯 `ExecutionContext`를 사용할 수 있다는 점이다.

다음 어떠한 라우트 핸들러 혹은 컨트롤러가 사용되는지 알 수 있기 때문에 요청이 들어오는 엔드포인트가 `Role`에 맞게 실행될 수 있도록 할 수 있다. 이 때 등장하는 개념이 `custom metadata`이다.

<br>

### custom metadata

`custom metadata`는 `@SetMetadata()`를 이용하여 **컨트롤러 혹은 라우터 핸들러에 metadata를 정의할 수 있다.**

```ts
@Get()
@SetMetadata('role', 'admin')
@UseGuards(RoleGuard)
getHello(): string {
return this.appService.getHello();
}
```

위와 같이 `@SetMetadata()`를 이용하여 `role`이라는 키 값으로 `admin`이라는 metadata를 정의하여 `getHello` 라우트 핸들러에 부여한 것이다.

하지만 공식문서에 따르면 라우터 핸들러에 직접 `@SetMetadata()`를 이용하는 것은 좋지 않은 방법이라고 말하고 있다. 그렇기 때문에 커스텀 데코레이터를 만들어 지정해 주도록 하자.

```ts
// custom decorator
export const Roles = (role: string) => SetMetadata('role', role);

// route handler
@Get()
@Role('admin')
@UseGuards(RoleGuard)
getHello(): string {
return this.appService.getHello();
}
```

커스텀 데코레이터를 이용하여 `Role`를 부여함으로 읽기 좋은 코드가 되었으며 **Type을 강제할 수 있게 되었다.**

<br>

### Reflector를 이용하여 metadata 이용

위의 개념들을 전부 합치면 `@SetMetadata()`(or 위에서 만든 커스텀 데코레이터)를 이용하여 라우트 핸들러에 metadata를 부여하고 `ExecutionContext`를 이용하여 가드를 통과하여 이후에 실행되는 라우터 핸들러에 대한 정보를 알 수 있었다.

그럼 라우터 핸들러에 부여된 metadata를 어떻게 가져올 수 있을까? `NestJs`에서는 `Reflector`를 이용하여 metadata에 접근을 할 수 있다. `Reflector`는 생성자에서 `DI`를 받을 수 있다.

```ts
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }
  canActivate(context: ExecutionContext,): boolean {
    const role = this.reflector.get<string>('role', context.getHandler());

    // do something
  }
}

export declare class Reflector {
  //...
  get<TResult = any, TKey = any>(metadataKey: TKey, target: Type<any> | Function): TResult;
  //...
}
```

`Reflector`에서 제공하는 `get`을 이용하여 metadata를 가져올 수 있으며 파라미터로 첫번 째는 키, 두번 째는 타입 혹은 `Function`을 받는다. 이 때 **타입이나 `Function`에 대한 정보를 `ExecutionContext`에서 얻어올 수 있게 되는 것이다.**

<br>

## Reference

- https://docs.nestjs.com/guards#guards

- https://wikidocs.net/158626
