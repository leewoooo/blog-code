NestJs에서는 환경을 어떻게 나눌까?
===

## Goal

- `NestJs`에서 Configuration를 어떻게 나눌 수 있는지에 대한 이해

- test, dev, production 환경 구성하기 

<br>

## 환경을 나눠야 하는 이유

애플리케이션을 개발할 때 하나의 환경에서 개발하여 배포까지 이뤄지지는 않는다.

Test를 할 때 필요한 환경, 개발을 할 때 필요한 환경, Production에서의 환경 등등.. 여러 환경이 필요하게 된다.

각 환경에서 사용되는 환경변수를 분리하고 상황에 맞게 가져다 쓰기 위해 `NestJs`에서는 `@nestjs/config`를 제공해준다.

마치 Spring에서 `application.yml, application.properties`에 각각 환경을 나누는 것과 비슷하다.

<br>

## NestJs에서 제공하는 `@nestjs/config`

`NestJs`에서는 환경을 구성하기 위해 필요한 dependency를 제공해준다. project의 root에서 아래의 명령어를 터미널에 입력하면 dependency를 추가할 수 있다.

```zsh
yarn add @nestjs/config
```

해당 패키지는 내부적으로 `Node`에서 환경을 나눌 때 주로 사용하는 `dotenv`를 내부적으로 사용하고 있다고 합니다.
>The @nestjs/config package internally uses dotenv.

## 사용법

### 환경변수 파일생성

사용법은 간단하다. 먼저 환경변수를 저장할 `.env`파일을 생성한다. Project Root에서 3개의 `.env` 파일을 생성하였다.

```
src
 ㄴ ...
 ㄴ .production.env
 ㄴ .development.env
 ㄴ .test.env
 ㄴ main.ts
```

각각의 `env`파일에는 다음과 같은 환경변수들이 담겨있다.

```
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
# 각 환경에 맞게 DATABASE_USER명이 다름
DATABASE_USER= 
DATABASE_PASSWORD=password
```

<br>

### `@nestjs/config`를 이용하여 Root모듈에 `ConfigModule`등록

`@nestjs/config`에서 제공하는 `ConfigModule`의 `static` method인 `forRoot()`를 이용하여 루트 모듈에 import를 해준다.

```ts
@Module({
  imports: [
    ConfigModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
```

`forRoot()`의 인자로는 `ConfigModuleOptions`를 받을 수 있는데 `ConfigModuleOptions`의 `interface`는 아래와 같이 정의되어 있다.

```ts
export interface ConfigModuleOptions {
    cache?: boolean;
    isGlobal?: boolean;
    ignoreEnvFile?: boolean;
    ignoreEnvVars?: boolean;
    envFilePath?: string | string[];
    encoding?: string;
    validate?: (config: Record<string, any>) => Record<string, any>;
    validationSchema?: any;
    validationOptions?: Record<string, any>;
    load?: Array<ConfigFactory>;
    expandVariables?: boolean | DotenvExpandOptions;
}
```

여러 옵션들이 있지만 살펴볼 옵션들은 다음과 같다. (나머지는 필요할 때 docs를 참고하여 사용하는 것으로~)

- `isGlobal?: boolean`

- `ignoreEnvFile?: boolean`

- `envFilePath?: string | string[]`

- `validationOptions?: any;`

<br>

#### `isGlobal?: boolean`

해당 Option은 Root Module에 `ConfigModule`을 등록할 때 key 이름 그래도 Global로 등록을 하는지에 대한 `boolean` 값이다.

Global로 등록을 하지 않으면 해당 모듈을 사용하는 곳에서 `import`를 받아야 

하지만

Global로 등록을 하게 되면 해당 모듈안에 있는 `provider`들을 `import`하지 않고 `Injection`받아 사용할 수 있다.

참조 [Global Module - NestJs](https://docs.nestjs.com/modules#global-modules)

<br>

#### `ignoreEnvFile?: boolean`

env파일을 사용할 것인지 아닌지에 대한 flag값을 설정한다. 해당 flag값이 `true`가 되면 env의 값들을 **읽어오지 않는다.**

<br>

#### `envFilePath?: string | string[]`

단독으로 지정할 수도 있고 배열로도 지정할 수 있으며 배열로 지정할 경우 순서대로 탐색하여 **가장 먼저 발견되는 `.env`파일을 로드하게 된다.**

주로 환경변수를 읽어 드릴 때 key가 되는 환경변수를 `NODE_ENV`로 사용하게 된다.

주로 조건식이나 `NODE_ENV`를 이용하여 정의하며 나는 아래와 같이 정의하였다.

```ts
envFilePath: `${__dirname}/config/env/.${process.env.NODE_ENV}.env`
```

서버를 실행할 때 `NODE_ENV`를 정의하고 실행시켜 `NODE_ENV`와 동일한 파일명의 `.env`가 읽어지게 되는 것이다.

주의점은 아래와 같다.

`NestJs`를 빌드할 때 **`.ts`파일을 제외한 `assets`파일들은 제외가 되여 `dist` 디렉토리에 포함되지 않는다.** 

그렇기 때문에 배포할 때 `.env`파일들을 포함하고 싶다면 `nest-cli.json`파일에 option을 추가해줘야 한다.

```json
{
  ...
  "compilerOptions": {
    "assets": [
      {
        "include": [config파일의 경로],
        "outDir": "./dist/[필요하다면 추가 경로]"
      }
    ]
  }
}
```

위의 option을 추가하면 `NestJs`빌드 결과물에 `.env`가 포함되개 된다. (꼭 `.env`말고도 static 파일들을 추가할 때 해당 option을 부여하면 빌드 결과물에 추가할 수 있다.)

<br>

#### `validationOptions?: any;`



<br>

## Reference

- https://docs.nestjs.com/techniques/configuration#configuration 

- https://darrengwon.tistory.com/965

- https://wikidocs.net/158579