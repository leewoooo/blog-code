NestJs Custom Decorators
===

예제 코드는 [Github](https://github.com/leewoooo/blog-code/tree/main/custom-decorators)에 있습니다 :)

## Goal 

- `NestJs`에서 Custom Decorators에 대해 알아보기

- Custom Decorators 만들어보기 

## Decorators란?

`TypeScript`및 ES6에 클래스가 도입됨에 따라, 클래스 및 클래스 멤버에 어노테이션을 달거나 수정하기 위해 추가 기능이 필요한 경우가 생겼다.

데코레이터는 클래스 선언과 멤버에 어노테이션과 메타-프로그래밍 구문을 추가할 수 있는 방법을 제공한다.

- 참조 : [TypeScript Decorators](https://typescript-kr.github.io/pages/decorators.html)

<br>

`NestJs`는 `ES6`에 도입된 데코레이터를 적극적으로 활용한다. 

타입스크립트에서 데코레이터가 아직 **실험적인 기능**이지만, 이미 많이 사용되고 있으며 안정적으로 잘 동작한다.<br>(tsconfig.json에서 `experimentalDecorators` 옵션을 설정해야 사용이 가능하다. `NestJs Cli`로 프로젝트를 생성할 경우 이미 추가되어 있다.) 

<br>

## Param decorators

`NestJs`는 라우트 핸들러의 매개변수에 적용할 수 있는 매개변수 데코레이터를 제공한다.

|내장 데코레이터 | Express 객체 |
| :--- | :--- |
| @Request(), @Req() | req | 
| @Response(), @Res() | res |
| @Next() | next |
| @Session() | req.session | 
| @Param(param?: string) | req.params / req.params[param]|
| @Body(param?: string) | req.body/ req.body[param] |
| @Query(param?: string) | req.query / req.query[param] |
| @Headers(param?: string) | req.headers/ req.headers[param] |
| @Ip() | req.ip |
| @HostParam() | req.host |

<br>

## Custom Decorators 만들기

이전 [Guard](https://velog.io/@dev_leewoooo/NestJs-Guard)글에서 `NestJs`는 유저의 인증/인가를 [Guard](https://velog.io/@dev_leewoooo/NestJs-Guard)에서 처리하도록 권장한다고 하였다.

많이 사용하는 방식으로는 로그인 할 때 발급한 JWT를 매 요청마다 헤더에 포함시키고, `Guard`에서 이 JWT를 검증해서(인증) 얻능 유저 정보를 가지고 요청을 처리해 나간다.

이 과정에서 라우터 핸들러에 전달된 **요청 객체(RequestBody)에 유저 정보를 실어서 이후에 이용하는 방법을 많이 사용한다.**

<br>

### Guard에서 Request에 user추가하기

`Request`에 User를 추가하는 과정은 아래와 같다. (JWT 검증이 완료되었다고 가정하고 하드코딩을 하겠다.)

```ts
@Injectable()
export class AppGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    req.user = {
      name: "leewoooo",
      email: "leewoooo.dev@gmail.com"
    }
    return true;
  }
}
```

<br>

여기서 중요한 것은 실행 컨텍스트에서 `getRequest()`를 호출할 때 제네릭을 부여하면 안된다는 것이다.

만약 제네릭으로 `Express`의 `Reuqest`를 정의해주었다면 `Express`의 `Request`에는 user가 없기 때문에 아래와 같은 error 메세지를 만날 수 있다..
```ts
'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>' 형식에 'user' 속성이 없습니다.ts(2339)
```

<br>

이렇게 `Request`에 User를 추가하였으면 요청이 들어오는 Controller에서 `@Req()`로 `Request`객체를 받아와 확인할 수 있다.

```ts
@Get()
@UseGuards(AppGuard)
getRequest(@Req() req): string {
  console.log(req.user);
  return this.appService.getHello();
}

output
//...
user: { name: 'leewoooo', email: 'leewoooo.dev@gmail.com' }
//...
```

<br>

### Custom Decorator를 만들어 @Req 대신 사용하기

위에서는 `@Req()`를 통해 User를 가져왔다. 

여기서 고려해야 할 점은 `@Req()`를 통해 가져온 **`Request`가 `any`라는 점과 `Request`에서 꺼내온 `user` 또한 `any`라는 점이다.**

가드에서 실행 컨텍스트를 통해 `Request`를 가져올 때 제네릭을 부여하지 않은 것처럼 컨트롤러에서도 `Request`에 대한 타입을 지정하면 안된다.

위와 같이 사용하게 되면 `Typescript`의 이점을 누릴 수 없게 된다.

<br>

공식문서를 보면서 생각한 결과는 `Guard에서` `Request`에 User를 넣어줄 때 타입을 명시하여 넣어주는 것이다. 비록 Custom Decorator에서 다시 꺼낼 때는 `Request`의 User가 `any`라고 하더라도...

이 후 컨트롤러에서 사용할 때 타입을 한번 더 명시해주는 것으로 `Guard`에서 `Custom Decorator`, `Controller`까지 동일한 타입의 흐름이라는 것을 명시하는 것이 안전한 것 같다. <br>(공식 문서에서는 `Request`에 넣어 줄 때 Type없이 넣어 준 후 pipe를 이용하여 검증하는 방법을 제공하고 있다. [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes))


Custom Decorator를 만들려면 `NestJs`에서 제공해주는 `createParamDecorator`함수를 이용하면 된다. 마지막으로 `Guard`에서 커스텀 데코레이터, `Controller`까지의 흐름을 살펴보는 것으로 마무리하겠다.<br>(`NestJs`에서는 `createParamDecorator`만 제공을 해주지만 다른 곳에서 사용하고싶은 데코레이터를 생성하고자 한다면 `Typescript`문서를 참조해 만들어 볼 수 있다.)



```ts
@@Guard
@Injectable()
export class AppGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = context.switchToHttp();

    const req = ctx.getRequest();
    // req.user는 any이지만 생성자를 통해 객체를 부여.
    req.user = new UserModel("leewoooo", "leewoooo.dev@gmail.com")

    return true;
  }
}

@@UserDecorator
export const UserData = createParamDecorator(
  // Guard에서 명시적으로 UserModel를 req.user에 넣어주었기 때문에 return type을 UserModel로 정의
  (data: unknow, ctx: ExecutionContext): UserModel => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return user
  }
)

@@Controller
@Get()
@UseGuards(AppGuard)
getHello(@UserData() user: UserModel) {
  console.log(user); 
  return this.appService.getHello();
}

// output UserModel { name: 'leewoooo', email: 'leewoooo.dev@gmail.com' }
```

<br>

## Reference

- https://www.typescriptlang.org/docs/handbook/decorators.html

- https://docs.nestjs.com/custom-decorators

- https://wikidocs.net/158634



