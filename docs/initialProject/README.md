NestJS Project 구조 살펴보기
===

## GOAL

- NestJs의 프로젝트 구조를 이해하는 것

<br>

## CLI 설치

`NestJs`를 설치하려면 기본적으로 `npm`이 필요로 하며 `npm`을 통해 `@nestjs/cli`를 설치하면 된다. (yarn을 사용해도 무관)

```zsh
npm i -g @nestjs/cli
```

<br>

## Project 생성

`CLI`가 준비되어 있다면 Project를 생성하는 일은 간단하다. 

```
nest new [project 명]

// 현재 프로젝트에 바로 프로젝트를 생성하고 싶은 경우
nest new .
```

위와 같이 터미널에 입력하면 `NestJs`프로젝트가 생성된다. (Java의 [Spring initializr](https://start.spring.io/)와 비슷하게 손 쉬운 프로젝트 생성이 가능)

<br>

## Project 구조

Project가 생성되면 여러 설정 파일들과 함께 `src` 디렉토리 밑에 아래와 같은 구조로 파일들이 생성된다.

```
src
 ㄴapp.controller.spec.ts
 ㄴapp.controller.ts
 ㄴapp.module.ts
 ㄴapp.service.ts
 ㄴmain.ts
```

정식 docs에 해당 각각 파일들의 기능들을 간단하게 설명하고 있다.

| 파일 명 | 기능 |
| :--- | :--- |
| `app.controller.ts` | 단일 경로가 있는 기본적인 컨트롤러입니다. |
| `app.controller.spec.ts` | 컨트롤러에 대한 단일 테스트 코드입니다. (테스트는 추 후 자세히 다룰 예정) |
| `app.module.ts` | 어플리케이션의 루트 모듈입니다. |
| `app.service.ts` | 하나의 방법으로 기본 서비스를 제공합니다. |
| `main.ts` | 핵심 기능 `NestFactory`을 사용하여 Nest 애플리케이션 인스턴스를 생성하는 애플리케이션의 항목 파일입니다. |

<br>

## main.ts

`Java`에서는 `main()`에서 부터 서버가 실행되듯 `NestJs`프로젝트에도 서버가 부트스트랩 되는 곳이 `main.ts`의 `bootstrap()`이다.

`main.ts`의 코드는 아래와 같다.

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

`main.ts`에는 `NestJs` 애플리케이션을 시작하는 비동기 부트스트랩 function을 가지고 있다.

`@nestjs/core`의 `NestFactory`를 `import`받아 애플리케이션의 **루트 모듈과 함께 `NestJs` 애플리케이션의 인스턴스를 생성하고 있다.**

생성된 애플리케이션을 `port`와 함께 `listen()`을 호출하면 `NestJs`를 통한 서버 애플리케이션이 실행된다.

<br>

## 플랫폼

`NestJs`는 플랫폼에 구애받지 않는 것을 목표로 한다고 한다. 즉시 제공하는 플랫폼은 `express`와 `fastify`가 있으며 선택하여 사용할 수 있고 기본적으로는 `express`를 기반으로 사용한다.

위의 `main.ts`의 코드를 조금 살펴보면 `create()` method에 제네릭을 부여하고 있는데 제네릭으로 부여할 수 있는 타입은 `INestApplication` 인터페이스이며 기본적으로 사용되는 `NestExpressApplication` 인터페이스는 아래와 같이 `INestApplication`를 상속받고 있다.

```ts
export interface NestExpressApplication extends INestApplication {...}
```

`fastify`를 사용하고 싶다면 [Performance (Fastify)](https://docs.nestjs.com/techniques/performance)를 참조하면 될 것 같다.

<br>

## Refference

https://docs.nestjs.com/first-steps