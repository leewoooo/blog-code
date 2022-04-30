NestJs API 버전관리
===

예제 코드는 [Github](https://github.com/leewoooo/blog-code/tree/main/api-versioning)에 있습니다:) ([Route Module](https://docs.nestjs.com/recipes/router-module#router-module) 기준이며 나머지는 주석)

## Goal

- NestJs에서 API 버전을 어떻게 관리할 수 있는지에 대하여 알아보기

<br>

## 개요

사내 레거시 프로젝트를 Nest로 이관을 하는 작업 중에 API의 엔드포인트에 버전이 명시되어 있는 API들이 존재하였다.

버전이 명시되어 있는 컨트롤러가 사용하는 서비스 객체는 버전마다 상이했으며 이곳, 저곳에 분산되어 있었다.

그렇기 때문에 버전마다 모듈을 만들어 버전이 지정된 컨트롤러와 해당 컨트롤러가 사용하고 있는 서비스를 묶어서 관리하기로 하였다. 그 과정에서 공식문서를 확인하던 도중 Nest에서 제공해주는 2가지 기능을 발견하여 정리하고자 한다.

1. [Route Module](https://docs.nestjs.com/recipes/router-module#router-module)

2. [Versioning](https://docs.nestjs.com/techniques/versioning#uri-versioning-type)

<br>

## [Route Module](https://docs.nestjs.com/recipes/router-module#router-module)

`NestJs`에서는 `Global prefix`를 사용하여 애플리케이션 전체의 컨트롤러에 `prefix`를 설정할 수 있지만 [Route Module](https://docs.nestjs.com/recipes/router-module#router-module)를 이용하면 **모듈 단위의 `prefix`이다.**

<br>

### Usage

예제로 만든 디렉토리 구조는 다음과 같다.

```zsh
|-- app.module.ts
`-- users
    |-- users.module.ts
    |-- v1
    |   |-- user-v1.module.ts
    |   `-- users.controller.ts
    `-- v2
        |-- user-v2.module.ts
        `-- users.controller.ts
```

<br>


users라는 모듈 안에 `v1`, `v2`라는 디렉토리가 존재하며 `users.module`가 존재하며 `v1`, `v2`에는 버전에 해당하는 모듈이 존재한다. 그럼 `v1`, `v2`안에 들어있는 컨트롤러의 엔드포인트를 확인해보자.

```ts
//file: v1/users.controller.ts
@Controller('users')
export class UsersV1Controller {
  @Get()
  getUsers(): string {
    return 'v1 getUsers Controller'
  }
}

//file: v2/users.controller.ts
@Controller('users')
export class UsersV2Controller {
  @Get()
  getUsers(): string {
    return 'v2 getUsers Controller'
  }
}
```

<br>

모듈별로 나누기 전에는 각각의 컨트롤러의 엔드포인트는 `v1/users`와 `v2/users`와 같은 방식으로 되어있었다. 하지만 [Route Module](https://docs.nestjs.com/recipes/router-module#router-module)로 모듈별 `prefix`를 정의하기로 하였기 때문에 컨트롤러마다 따로 **버전을 명시하지 않았다.**

이제 각 버전별로 모듈에 컨트롤러가 등록되었다면 해당 모듈을 `users` 디렉토리 최상단에 있는 `users.module`에 `import`하면서 [Route Module](https://docs.nestjs.com/recipes/router-module#router-module)를 사용한다.

```ts
//file: users.module.ts
@Module({
  imports: [
    UsersV1Moduel,
    UsersV2Moduel,

    RouterModule.register([
      {
        path: 'v1',
        module: UsersV1Moduel
      },
      {
        path: 'v2',
        module: UsersV2Moduel
      }
    ])
  ]
})
export class UsersModule { }
```

<br>

위와 같이 `RouterModule.register`를 통해 각 모듈 별 `prefix`를 정의해 줄 수 있으며 애플리케이션을 실행시켜 보면 아래와 같은 시스템 로그를 확인할 수 있다.

```ts
[Nest] 31916  - 2022. 04. 29. 오후 10:12:25     LOG [RoutesResolver] UsersV1Controller {/v1/users}: +73ms
[Nest] 31916  - 2022. 04. 29. 오후 10:12:25     LOG [RouterExplorer] Mapped {/v1/users, GET} route +4ms 
[Nest] 31916  - 2022. 04. 29. 오후 10:12:25     LOG [RoutesResolver] UsersV2Controller {/v2/users}: +1ms
[Nest] 31916  - 2022. 04. 29. 오후 10:12:25     LOG [RouterExplorer] Mapped {/v2/users, GET} route +1ms 
```

<br>

`CURL`을 이용하여 `v1`, `v2`에 요청을 보내 응답을 확인해보자.


```zsh
// v1
curl --request GET --url http://localhost:3000/v1/users
output : v1 getUsers Controller

// v2
curl --request GET --url http://localhost:3000/v2/users
output : v1 getUsers Controller
```

<br>

API의 엔드포인트를 어떻게 설계하냐에 따라 사용법이 달라질 수도 있다. 사내에서는 `버전/도메인/...` 으로 엔드포인트를 설계 되었기 때문에 위와 같이 등록하였다. 하지만 만약 `도메인/버전/...`라면 아래와 같이 사용도 가능하다. 

컨트롤러에는 따로 엔드포인트를 정의하지 않고 [Route Module](https://docs.nestjs.com/recipes/router-module#router-module)를 이용하여 `prefix` 전체를 정의할 수 있는데 `children`이라는 프로퍼티를 이용하여 하위 자식 모듈까지 지정이 가능하다.

```ts
@Module({
  imports: [
    UsersV1Moduel,
    UsersV2Moduel,

    RouterModule.register([
      {
        path: 'users',
        children: [
          {
            path: 'v1',
            module: UsersV1Moduel
          },
          {
            path: 'v2',
            module: UsersV2Moduel
          }
        ]
      },

    ])
  ]
})
export class UsersModule { }

//output
[Nest] 3496  - 2022. 04. 29. 오후 10:17:58     LOG [RoutesResolver] UsersV1Controller {/users/v1}: +64ms
[Nest] 3496  - 2022. 04. 29. 오후 10:17:58     LOG [RouterExplorer] Mapped {/users/v1, GET} route +3ms 
[Nest] 3496  - 2022. 04. 29. 오후 10:17:58     LOG [RoutesResolver] UsersV2Controller {/users/v2}: +1ms
[Nest] 3496  - 2022. 04. 29. 오후 10:17:58     LOG [RouterExplorer] Mapped {/users/v2, GET} route +2ms 
```

<br>

## [Versioning](https://docs.nestjs.com/techniques/versioning#uri-versioning-type)

`NestJs`에서는 API를 Versioning할 수 있는 방법을 4가지 제공한다.

1. URI Versioning Type (default)

2. Header Versioning Type

3. Media Type Versioning Type

4. Custom Versioning Type

이 글에서는 `URI Versioning Type`에서만 알아볼 것이며 다른 타입들이 필요하다면 [Versioning](https://docs.nestjs.com/techniques/versioning#uri-versioning-type)를 참조하면 좋을 것 같다.

<br>

###  `URI Versioning Type`

`NestJs`에서는 Versioning할 때 기본적으로 `URI Versioning Type`을 사용한다. 사용하는 방법은 `controller` 혹은 `route handler`에 해당하는 버전을 명시해주면 된다.

컨트롤러에 버전을 명시하는 방법은 다음과 같다.

```ts
//file: user-v1.controller.ts
@Controller({ version: '1', path: 'users' })
export class UsersV1Controller {
  @Get()
  getUsers(): string {
    return 'v1 getUsers Controller'
  }
}
```

<br>

라우터 핸들러에 등록하는 방법은 다음과 같다.

```ts
@Controller()
export class UsersV1Controller {

  @Version('1')
  @Get('users')
  getUsers(): string {
    return 'v1 getUsers Controller'
  }
}
```

<br>

위와 같이 컨트롤러 혹은 라우트 핸들러에 버전을 명시해준것으로 API의 엔드포인트가 변경되지는 않는다. `main.ts`에 또 한가지의 설정을 해주어야 한다.

`app.enableVersioning()`를 이용하여 option을 줄 수 있는데 여기서 버전 앞에 붙을 `prefix` 또한 설정이 가능하다.

```ts
//file: main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v' //prefix를 v로 정의
  })
  await app.listen(3000);
}
bootstrap();
```

<br>

이제 API에 대한 Versioning이 끝났다. 애플리케이션을 실행시켜보면 [Route Module](https://docs.nestjs.com/recipes/router-module#router-module)을 이용했을 때와 다른 시스템 로그를 볼 수 있다.

```ts
[Nest] 9844  - 2022. 04. 29. 오후 10:49:11     LOG [RoutesResolver] UsersV1Controller {/users} (version: 1): +67ms
[Nest] 9844  - 2022. 04. 29. 오후 10:49:11     LOG [RouterExplorer] Mapped {/users, GET} (version: 1) route +3ms 
[Nest] 9844  - 2022. 04. 29. 오후 10:49:11     LOG [RoutesResolver] UsersV2Controller {/users} (version: 2): +1ms
[Nest] 9844  - 2022. 04. 29. 오후 10:49:11     LOG [RouterExplorer] Mapped {/users, GET} (version: 2) route +0ms 
```

`RouterExplorer`에 의해 API가 매핑될 때 `(version: 1)`와 같은 시스템 로그를 확인할 수 있다.

이 후 요청에 대한 응답은 [Route Module](https://docs.nestjs.com/recipes/router-module#router-module)예제와 동일한 응답을 받게 된다.

<br>

## Reference

- https://docs.nestjs.com/recipes/router-module#router-module

- https://docs.nestjs.com/techniques/versioning#versioning