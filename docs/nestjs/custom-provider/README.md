NestJs의 Custom Provider란? (With 역할과 구현)
===

## Goal

- Custom Provider가 왜 나오게 되었는지에 대한 이해

- Custom Provider의 사용법

<br>

## Custom Provider가 왜 필요한가?

[이전 글](https://velog.io/@dev_leewoooo/NestJs-Provider)에서 작성한 것처럼 `NestJs`는 `Spring`과 달리 `Interface`타입으로 `Provider`를 등록할 수 없다. 

찾아보니 이미 누가 [`issue`](https://github.com/nestjs/nest/issues/43)를 등록하여 물어보았고 해당 `issue`는 아래와 같은 답변과 함께 닫혀있었다.

<img src = https://user-images.githubusercontent.com/74294325/160842891-68f85b48-b380-4a6b-b48d-91df993aa908.png>

<br>

정리하자면 `Typescript`를 이용하여 정의한 `Interface`는 **컴파일이 되면 사라지기 때문에 `Interface`타입으로는 DI를 받을 수 없다고 한다.**

<br>

## 그럼 `NestJs` 역할과 구현으로 나눌 수 없는건가..?

결론부터 말하자면 **나눌 수 있다.**(Spring처럼 `Interface`를 구현하고 `@Bean`나 `@Component`를 추가하는 것보다는 조금 번거로울 수는 있다.)


먼저 `Interface`를 `Provider`로 등록했을 경우 어떻게 되는지 보자면 아래와 같다.

```ts
//ant-service.interface.ts
export interface AntService {
    work(): void
}

//ant.service.ts
@Injectable()
export class AntServiceImpl implements AntService{
  work(): void {
    console.log('working hardly');
  }
}

//ant.moduel.ts
@Module({
  controllers: [AntController],
  providers: [
    AntService
  ]
})
export class AntModule {}
```

위와 같이 code를 작성하면 `compile error`를 만날수 있다..!

<img src = https://user-images.githubusercontent.com/74294325/160847441-c31deb15-224a-48e5-a349-1d677490e7eb.png>

<br>

### Custom Provider를 이용하여 역할과 구현 분리하기

`NestJs`는 여러 `Custom Provider`를 제공하는데 그 중 `ClassProvider`를 이용하여 분리해보겠다. `NestJs`에서 제공하는 `ClassProvider Interface`는 다음과 같다.

```ts
export interface ClassProvider<T = any> {
    // export declare type InjectionToken = string | symbol | Type<any> | Abstract<any> | Function;
    provide: InjectionToken;
    useClass: Type<T>;
    scope?: Scope;
}
```

위의 `Interface`를 따라 `CustomProvider`를 만들어 `Module`에 등록할 수 있다. 위의 `AntService`를 이용해 예제코드로 작성하겠다.

```ts
const antService: ClassProvider = {
  provide: 'antService',
  useClass: AntServiceImpl
} 

@Module({
  controllers: [AntController],
  providers: [
    antService
  ]
})
export class AntModule {}
```

이와 같이 `ClassProvider`를 이용하여 `CustomProvider`를 만들어 `Module`에 등록을 해주었다. 그럼 해당 `Provider`를 가져다 쓰는 곳에서는 **아래와 같이 역할(`Interface`) 타입으로 `Provider`를 주입받으면 된다.**

```ts
@Controller('ant')
export class AntController {
  // 이전과 달리 구현class를 의존하는 것이 아닌 interface를 의존할 수 있게 되었다.
  constructor(@Inject('antService') private readonly antService: AntService){}

  @Get()
  excuteWork(){
      this.antService.work();
  }
}
```

`Custom Provider`를 이용하기 전까지는 `AntController`가 `AntServiceImpl`을 직접 주입받아 사용하였을 것이다. `Custom Provider`를 이용함으로 **의존성을 낮추고 이 후 `AntService`의 구현체가 변경되더라도 `AntModule`에서만 변경해주면 된다.**

<Br>

## 다음으로

이번 정리에서는 `Custom Provider`를 이용하여 `Nest`에서는 `역할`과 `구현`을 어떻게 나눠야 되는지 살펴보았다. (`Custom Provider`의 사용법이나 자세한 것들은 [Custom Provider](https://docs.nestjs.com/fundamentals/custom-providers#custom-providers)에서 살펴볼 수 있다.)

`역할`과 `구현`으로 나눔으로 코드 구조가 유연해졌으며, 이 후 **확장이 가능해진다.** 또한 `Client Code`를 수정하는 일이 줄어들 것이다.

`Test Code`를 작성할 때 `Interface`에 의존을 하다보니 **구현 객체를 Mocking하여 넣어서 Test가 가능해진다.** (테스트에 관련된 글을 작성할 때 `CustomProvider`를 이용한 유닛테스트를 진행해보겠다.)

다음으로는 `NestJs`에서의 `Module`에 대하여 공부할 계획이다.

<br>

## Reference

- https://docs.nestjs.com/fundamentals/custom-providers#custom-providers

- https://wikidocs.net/150149
