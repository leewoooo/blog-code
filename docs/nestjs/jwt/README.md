# NestJs에서 인증처리 하기

예제코드는 [Github](https://github.com/i-am-a-toy/passion/blob/develop/backend/src/auth/services/token.service.spec.ts)에서 볼 수 있습니다 :)

## Goal

- 토큰 기반의 인증처리 정리 (with JWT)

- 기존 jsonwebtoken을 이용하던 것을 `@nestjs/jwt`를 이용하여 처리하기

<br>

## Why Token 기반 인증?

토이 프로젝트를 하면서 인증에 관한 부분을 구현하는 도중 `session`기반의 인증과 `token`기반의 인증을 두고 고민을 하였다.

아무래도 `session`기반의 인증을 사용하게 되면 `session`을 저장해야 하기 때문에 `session`기반의 인증이 아닌 `token`기반의 인증을 선택하였다. (~~refreshToken는 DB에 저장하기는 한다~~)

메모리 상에 저장한다고 하더라도 로그인 한 유저가 증가하면 서버에 부하가 걸릴 수도 있기 때문에 선택하지 않았다.

추 후 토이 프로젝트에서 AWS의 RDS를 사용하게 된다고 하면 클라이언트가 API를 호출할 때 마다 `DB`에 있는 `session`을 조회하는 네트워크 비용을 줄이고 싶어서이기도 하다.

<br>

## Token 기반 인증

토큰 기반의 인증 시스템은 **인증받은 사용자들에게(로그인을 통과한) 토큰을 발급하고, 서버에 요청을 할 때 헤더에 토큰을 함께 보내도록 하여 유저의 인증을 처리한다.**

이로 인해 사용자의 인증 정보를 서버나 세션에 유지하지 않고 클라이언트 측에서 들어오는 요청만으로 작업을 처리한다.

서버에는 따로 저장을 하는 것이 없기 때문에 별도의 저장소가 필요하지 않으며 **상태를 가지지 않게 되기 때문에 확장에 용이한 구조를 지향할 수 있다.**

<br>

## 내가 정의한 인증 과정

토이 프로젝트를 진행하면서 정의한 인증 과정의 흐름이다.

1. 유저가 id와 password를 가지고 로그인을 요청한다.

2. 유저가 인증을 완료하면 토큰을 생성한다. Refresh 정책을 가져가기로 하였기 때문에 `AccessToken`과 `RefreshToken`을 생성한다.

   - `AccessToken`에는 유저에 정보를 `claim`으로 사용하고 `RefreshToken`에는 유저의 id를 `claim`으로 사용한다.
   - `AccessToken`과 `RefreshToken`의 만료시간을 설정하며 `RefreshToken`의 유효시간을 더 길게 가져간다.

3. `AccessToken`은 Client에게 넘겨주고 `RefreshToken`은 DB에 저장한다.

4. Client는 요청을 보낼 때 마다 `Header`에 `Authorization: Bearer ${AccessToken}`을 추가하여 요청을 보낸다.

5. Server는 `Heaedr`에서 토큰을 파싱하여 유효한지 검사 한 후 요청에 알맞는 응답을 한다.

6. 만약 Client가 가지고 있는 `AccessToken`이 만료가 되면 만료된 `AccessToken`을 가지고 `Refresh`를 요청하게 되며 DB에 `RefreshToken`이 유효하면 새로운 `AccessToken`을 만들어 응답을 하게 된다.

7. 유저가 로그아웃을 하면 DB에 저장되어 있는 `RefreshToken`을 삭제한다.

<br>

## JWT Token Service 구현

`nestjs`에서 `JWT`를 사용하기 위해서는 `@nestjs/jwt`를 추가하여 준다. `@nestjs/jwt`는 내부적으로 `jsonwebtoken`을 사용한다.

기존에는 `jsonwebtoken`를 사용하여 직접 구현하여 사용하였지만 `nestjs`에서 제공하는 것을 사용하여 처리하기로 하였다. (~~사실 `jsonwebtoken`를 사용하여 직접 구현하는 것과 크게 차이가 없음~~)

```zsh
yarn add @nestjs/jwt
```

<br>

### JwtModule 생성

사용법은 간단하다. `JwtModule`을 `import`받아서 `jwt`에 대한 `options`들을 설정해주면 된다. 추가적인 `options`들은 [jwt module options](https://github.com/nestjs/jwt/blob/master/lib/interfaces/jwt-module-options.interface.ts)을 참조하면 된다.

정의하는 법은 아래의 코드와 같으며 `JwtService`를 `inject`받기만 하면 쉽게 사용할 수 있으며 `secret`를 새로 부여하지 않는 이상 `JwtModule`를 만들 때 정의한 `secret`를 사용하게 된다.

```ts
@Module({
  imports: [
    JwtModule.register({
      secret: ${secretKey},
      signOptions: {
        ...
      }
    })
  ]
})
export class AppModule{}
```

[jsonwebtoken api spec](https://github.com/nestjs/jwt#api-spec)를 자세히 보면 `jsonwebtoken`와 달리 `sign()`, `verfify()`를 이용할 때 `secret`, `publicKey` 속성을 재정의 할 수 있다. 따라서 `test`를 작성할 때 `secret`과 같은 값을을 커스텀 할 수 있다.

> Differing from jsonwebtoken it also allows an additional secret, privateKey, and publicKey properties on options to override options passed in from the module. It only overrides the secret, publicKey or privateKey though not a secretOrKeyProvider.

<br>

### JwtService를 이용하여 token 생성하기

`JwtService`가 토큰을 생성할 때 제공해주는 메소드는 `sign()`과 `signAsync()`를 제공한다.

차이점은 이름에서부터 알 수 있듯 `sign()`이 동기적으로 동작하고 `signAsync()`는 비동기로 `Promise`를 return 한다. (현재 글은 `sign()`기준으로 작성)

```ts
//@nestjs/jwt
sign(payload: string | Buffer | object, options?: JwtSignOptions): string;

//tokenServie
export class TokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  createToken(claimPlain): { accessToken: string } {
    const accessToken = this.jwtService.sign(claimPlain, { ...options });
    ...
  }
}
```

<br>

token을 생성할 때 `sign`에 들어가는 첫번 째 파라미터는 `string | Buffer | object`를 받는다. 프로젝트를 `class`기반으로 코드를 작성하다 보니 첫번 째 인자로 `class`의 인스턴스를 넣었더니 아래와 같은 `error`를 만나게되었다.

```
Expected "payload" to be a plain object.
```

<br>

#### 해결법

해결하는 방법은 첫번 째 인자로 `plain`을 넣어주는 것이다. `class`의 인스턴스를 `plain`으로 변경하는 방법은 2가지 정도가 있는다.(~~더 있을 수도?~~)

첫번째는 `class`에 `toPlain()`이라는 메소드를 구현하는 것이다. return으로 `plain` 객체를 리턴해주면 된다.

```ts
toPlain(): { id: number; name: string; roleName: string } {
  return {
    id: this._id,
    name: this._name,
    roleName: this._roleName,
  };
}
```

두번째 방법으로는 `class-transformer`를 이용하는 것이다. `class-transformer`가 제공해주는 `instanceToPlain()`을 이용하여 넣어주면 된다.

```ts
instanceToPlain(${instance});
```

<br>

#### sign Option 부여하기

토큰을 생성할 때 부여할 수 있는 `options`을 `sign()`의 두번 째 인자로 부여를 하며 `jsonwebToken`의 `SignOptions`을 상속받은 `JwtSignOptions` 타입이며 아래와 같다.

`secret`을 재정의 할 수 있는 것 말고는 [jsonwebtoken - sign](https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback)과 동일하다

```ts
export interface JwtSignOptions extends jwt.SignOptions {
  secret?: string | Buffer;
  privateKey?: string | Buffer;
}
```

<br>

### JwtService를 이용하여 토큰 검증하기

`JwtService`가 토큰을 검증할 때 제공해주는 메소드는 `sign()`과 동일하게 동기, 비동기 2가지를 제공한다. (현재 글은 `verfify()`기준으로 작성)

```ts
//@nestjs/jwt
verify<T extends object = any>(token: string, options?: JwtVerifyOptions): T;

//tokenService
export class TokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  validate<T extends Object>(token: string): T {
    try {
      return this.jwtService.verify<T>(token, { ...options });
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
```

`verfify()`를 통해 token을 검증할 수 있으며 검증 시 토큰이 유효하지 않으면 `error`를 발생시킨다. 그렇기 때문에 `try/catch`문을 사용하여 `error`처리를 해줘야한다.

<br>

#### verfify Option 부여하기

`sign()`과 동일하게 검증을 할 때 사용하는 `options`를 두번째 인자로 정의하며 `jsonwebtoken`의 `VerifyOptions`를 상속받은 `JwtVerifyOptions` 타입이다.

`secret`을 재정의 할 수 있는 것 말고는 [jsonwebtoken - verfify](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback)과 동일하다

```ts
export interface JwtVerifyOptions extends jwt.VerifyOptions {
  secret?: string | Buffer;
  publicKey?: string | Buffer;
}
```

<br>

## 다음으로

`@nestjs/jwt`를 이용하여 토큰 기반의 인증을 구현해보았다. 다음으로는 인증된 User의 정보를 `@nestjs/passport`를 이용하여 사용하는 법을 정리해보겠다.

<br>

## REFERENCE

- https://github.com/auth0/node-jsonwebtoken

- https://github.com/nestjs/jwt
