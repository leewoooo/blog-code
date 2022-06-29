# NestJs에서 Passport를 이용하여 인증미들웨어 처리하기

예제코드는 [Github](https://github.com/i-am-a-toy/passion/tree/develop/backend/src/config/passport)에 있습니다 :)

## Goal

- 기존 `Guard`를 이용하여 직접 구현하였던 인증 처리를 `@nestjs/passport`에게 위임하기

- 데코레이터를 이용하여 `Controller`에서 바로 받아서 사용하기

<br>

## Passport란?

Passport 는 커뮤니티에서 잘 알려져 있고 많은 프로덕션 애플리케이션에서 성공적으로 사용되는 인증 라이브러리이다. Passport는 다양한 인증 메커니즘을 구현하는 [전략 에코시스템들](http://www.passportjs.org/packages/)을 가지고 있다. (현재 글에서는 `jwt`를 기준으로 작성)

Passport를 `nestjs`에서 사용하기 위해서 필요한 라이브러리들을 아래와 같이 설치한다.

```zsh
yarn add @nestjs/passport passport passport-jwt
yarn add @types/passport-jwt -D
```

<br>

## Nestjs에서 사용하기

`PassportStrategy`를 상속받은 `provider`를 구현해주면 된다. `PassportStrategy`를 상속받을 때 **전략을 선택할 수 있으며,** 해당 `provider`의 생성자에서 `super()`를 호출하여 **전략의 options**를 넣어줄 수 있다.

<br>

### 부모 생성자에 options 넣어주기

현재 jwt전략을 사용하고 있기 때문에 사용할 수 있는 options는 `passport-jwt`의 `StrategyOptions`에서 확인이 가능하며 아래와 같다.

```ts
export interface StrategyOptions {
  secretOrKey?: string | Buffer | undefined;
  secretOrKeyProvider?: SecretOrKeyProvider | undefined;
  jwtFromRequest: JwtFromRequestFunction;
  issuer?: string | undefined;
  audience?: string | undefined;
  algorithms?: string[] | undefined;
  ignoreExpiration?: boolean | undefined;
  passReqToCallback?: boolean | undefined;
  jsonWebTokenOptions?: VerifyOptions | undefined;
}
```

<br>

### validate() 구현하기

`validate`라는 메소드를 작성하는 이유는 Passport 라이브러리가 전략에 맞게 `verfiy()`를 호출하지만 `nestjs`에서는 `validate()`로 구현되기 때문이다.

`validate()` 메소드에서 토큰의 `claim`을 인자로 받게되며 해당 값을 가지고 추가적인 인증처리를 진행할 수 있다.

<br>

### 최종코드

```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKey: "foobar", // 1
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 2
    });
  }

  validate(tokenClaim: any) { // 3
    if (...){
      throw new UnauthorizedException();
    }
    return ...
  }
}
```

<br>

1. Passport에서 요청으로 들어오는 jwt를 검증할 때 사용할 `secretkey`를 정의.

2. Passport로 인증할 때 jwt 토큰을 가져오는 위치를 정의한다. 현재는 `Authorization: Bearer token`으로 가져오기 때문에 `fromAuthHeaderAsBearerToken`를 사용

3. jwt의 검증이 완료되면 토큰의 `claim`이 들어오며 내부적으로 `claim`의 값을 검증할 수 있다. 검증 후 `return`해준 값은 **`Express.Request`의 `user`라는 프로퍼티로 값이 들어가게 된다.**

<br>

## Passport Module 만들기

전략을 통해 인증 처리하는 로직을 완성하였기 때문에 Passport 모듈만 생성해주면 된다.

필요한 모둘에서 Passport를 등록해주면 되지만 그렇게 되면 위에서 구현한 `JwtStrategy` 또한 `provider`로 등록을 해야한다.

원하는 것은 다른 `configModule`들 처럼 `app.module`에서 설정을 포함한 Passport 모듈을 import하고, 사용하는 `module`에서 Passport 모듈만 import하여 쓰기를 원하기 때문에 아래와 같이 작성하였다.

```ts
@Module({
  imports: [
    PassportModuel, // 1
    // PassportModule.register({defaultStrategy: "jwt"}),
  ],
  providers: [JwtStrategy], // 2
  exports: [PassportModule],
})
export class PassportConfigModule {}
```

1. Passport `module`을 import 한다. 만약 기본 전략을 설정하고 싶다면 `defaultStrategy`를 설정하면 된다.

2. `provider`로 구현한 전략을 추가해준다.

<br>

## Controller에 적용하기

`@nestjs/passport`에서 제공하는 `AuthGuard()`를 이용하여 적용할 수 있다.

```ts
@Controller()
export class UsersController {
  @Get("/test")
  @UseGuards(AuthGuard("jwt")) // 1
  test(@Req() req: Request) {
    console.log(req);
  }
}
```

1. 첫번째 파라미터로 사용할 전략을 받으며 입력하지 않은 경우 Passport 모듈에서 정의한 기본전략을 따르게 된다.

<br>

만약 Passport에서 인증처리가 실패하는 경우 아래와 같은 응답을 받을 수 있다.

```ts
{
	"statusCode": 401,
	"message": "Unauthorized"
}
```

<br>

## Request에서 `user`를 꺼내 사용하기

인증 처리가 통과된다면 [validate()](#validate-구현하기)의 인자로 토큰의 `cliam`이 들어오게 된며 위에서 설명하였듯 `Express.Request`의 `user` 프로퍼티로 들어가게 된다.

이전 [`Custom Decorator`](https://velog.io/@dev_leewoooo/NestJs-Custom-Decorators#custom-decorator%EB%A5%BC-%EB%A7%8C%EB%93%A4%EC%96%B4-req-%EB%8C%80%EC%8B%A0-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0)에 대한 글을 참조하면 쉽게 만들 수 있으며 코드는 아래와 같다.

```ts
export const CtxUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ContextUser => {
    const req = ctx.switchToHttp().getRequest(); // 1
    return req.user; // 2
  }
);
```

1. `ExecutionContext`에서 `Express.Request`를 얻어온다.

2. `req`에 실려있는 user를 `return`한다.

<br>

`Controller`에서는 아래와 같이 사용하면 [validate()](#validate-구현하기)에서 return한 값을 그대로 꺼내다 사용할 수 있다.

```ts
@Controller()
export class UsersController {
  @Get("/test")
  @UseGuards(AuthGuard("jwt"))
  test(@CtxUser() user: ContextUser) {
    console.log(req);
  }
}
```

<Br>

## 마무리

[토큰기반 인증 구현하기](https://velog.io/@dev_leewoooo/NestJs%EC%97%90%EC%84%9C-%ED%86%A0%ED%81%B0%EA%B8%B0%EB%B0%98-%EC%9D%B8%EC%A6%9D-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0-with-JWT)부터 현재 글을 통해 `nestjs`에서 전반적인 인증처리를 어떻게 해야하는지 살펴보았다.

추 후에는 권한처리를 하는 방식으로 돌아오겠다.

<br>

## REFERENCE

- https://docs.nestjs.com/security/authentication

- https://github.com/nestjs/passport

- https://github.com/jaredhanson/passport
