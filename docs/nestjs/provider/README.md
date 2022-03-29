Nest에서 Provider는 무엇일까?
===

## Goal

- `NestJs`의 Provider라는 개념을 이해하기

<br>

## Provider란?

`Provider`는 `NestJs`의 기본 개념이다. 기본 `NestJs` class의 대부분은 `Service`, `Repository`, `Factory`, `Helper` 등 여러가지 형태로 구현이 가능하다.

`Provider`의 핵심은 종속성으로 `주입(Injection)` 될 수 있다는 것이다.(스프링의 `bean`과 개념이 유사) 즉, 객체는 서로 다양한 관계를 생성할 수 있으며 객체와 객체의 관계를 맺어주는 `역할`을 분리할 수 있다. (**해당 역할을 `NestJs` 런타임 시스템에 위임하게 되는 것**)

<img src = https://docs.nestjs.com/assets/Components_1.png>

<br>

`Java`에서는 `Spring`을 이용하여 `DIP`를 지킬 수 있게되고 `Node`에서는 `NestJs`를 이용히여 `DIP`를 지킬 수 있게 되는 것이다.

그렇다고 Java와 같이 `NestJs`가 **Interface 타입으로 Provider를 등록하는 것은 불가능하다.**(CustomProvider 글을 정리할 때 code로 작성해 볼 예정)

<br>

## Provider라는 개념이 왜 나오게 되었을까?

공식 문서의 `HINT`에 적혀있는 내용을 보면 알 수 있다.

>HINT<br>Since Nest enables the possibility to design and organize dependencies in a more OO-way, we strongly recommend following the SOLID principles.


즉 **`객체지향`의 속성들을 이용하여 보다 좋은 구조 및 `code`를 작성하기 위해서이다!**

<br>

### DIP(Dependency inversion principle)

객체는 저수준 모듈보다 고수준 모듈에 의존을 해야한다라는 원칙이지만 **쉽게 이야기하여 구현 class(구현)에 의존하지 말고, 인터페이스(역할)에 의존하라는 뜻이다.**

구현체를 직접 의존하고 있게 되면 코드의 유연성이 떨어지게 되며 구현체를 바꿀 때 `OCP`까지 위반되기 때문에 인터페이스를 의존하여 **조립되는 시점에서 처리하여 의존성을 낮출 수 있는 장점이 있다.**

<br>

## Provider 사용법

### 등록하기

`NestJs cli`를 이용하여 project를 생성 후 `src`안에 있는 `app.module.ts`를 살펴보면 다음과 같은 코드가 보일 것이다. (만약 `NestJs` 프로젝트 구조가 궁금하다면 [이전 글](https://velog.io/@dev_leewoooo/NestJs-init)을 참조하자.)

```ts
@Module({
  // ...
  providers: [AppService],
})
export class AppModule {}
```

이미 `AppService`라는 Provider가 등록되어 있다. 이와 같이 `Provider`로 사용 할 `class`를 `Module`에 등록을 해주면 된다.

<br>

### Injectable() 살펴보기

`AppService` class를 살펴보면 데코레이터로 `@Injectable()`이 붙어있는 것을 볼 수 있다.

공식문서에 따르면 `Injectable()` 데코레이터를 사용하게 되면 `NestJs IoC`에 의해 관리되는 것이라고 명시해주는 것이라 한다.

`@Injectable`이라는 데코레이터가 붙어 있어야 **현재 `Module`가 아닌 다른 `Module`에서도 `DI`를 받을 수 있게 된다.** (같은 `Module`에서는 `@Injectable`이 없어도 가능하다.)

<br>

### DI 받기

`AppController`에서 보면 **생성자를 통해** `AppService`를 `DI`받고 있다. (property 주입도 가능하지만 생성자를 통해 주입받는 것을 **지향하자**.)

아래의 코드가 가능한 이유는 `Typescript`의 기능을 사용한 것이다. `Typescript`에서는 `JS`에서 사용할 수 없는 **접근 지시자**를 생성자 파라미터 앞에 지정해주면 해당 **class의 property로 선언이 된다.**

```ts
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}
}
```

이 후 `AppController`안에서 `this.configService`라고 접근하여 사용할 수 있다.

<br>

### 다른 `Module`의 Provider를 `DI`받으려면?

여기서 중요한 점은 다른 `Module`에서 Provider를 주입을 받으려면 **Provider**를 정의한 `Module`에서 `exports`해줘야 한다. 만약 `exports`를 하지 않는 다면 다음과 같은 error를 볼 수 있을 것이다.

```zsh
//error
Error: Nest can not resolve dependencies of the [생성자에서 DI를 받으려는 class명] (?). Please make sure that the argument [Provider 명] at index [0] is available in the [현재 Moduel명] context.

//solution
Potential solutions:
- If [Provider 명] is a provider, is it part of the current [현재 Moduel명]?
- If [Provider 명] is exported from a separate @Module, is that module imported within [현재 Moduel명]?
  @Module({
    imports: [ /* the Module containing [Provider 명] */ ]
  })
```

간단하게 정리하자면 

- error: `NestJs`가 의존성 주입을 해결하지 못했다.

- solution

    - 현재 의존성 주입을 하려는 Provider가 현재 `Module`의 일부인지 확인

    - 현재 `Module`가 아니라면 Provider를 정의한 `Module`에서 `exports`를 하였는지 확인

    - 현재 `Module`에서 `Provider`를 정의한 `Module`를 `imports`받았는지 확인

<br>

### Optional Provider 주입받기.


