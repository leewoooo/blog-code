# NestJs의 pipe란?

## Goal

- NestJs에서의 pipe에 대한 이해 및 사용

- Custom Pipe 작성

<br>

## Pipe란?

공식 문서에서는 `pipe`란 `@Injectable` 데코레이터를 가지고 있으며 `PipeTransfrom`을 구현한 class라고 설명하고 있다.

<img src = https://docs.nestjs.com/assets/Pipe_1.png>

<Br>

`pipe`는 두 가지의 일반적인 사례를 가지게 된다.

- 변환: Client에게 입력받은 데이터 형식을 **원하는 형식으로 변환**(예를들어 문자열을 정수로)

- 검증: Client에게 입력받은 데이터의 유효성을 체크하고 데이터가 올바르지 않으면 **예외를 던진다.**

두 경우 모두 **`controller`의 핸들러에 들어오는 인수에 대해 작동을 하게 된다.** `NestJs`의 핸들러가 호출되기 전에 `pipe`에서 핸들러에 들어오는 **인수**를 받게 되고 정의한 `pipe`가 동작하게 된다.

간단하게 설명하자면 Client에게서 받은 요청에 대해 `pipe`에서 먼저 **변환 혹은 검증** 을 진행 후 유효하면 **핸들러가 호출되고 그렇지 않다면 `exception | error` 을 발생시킨다.**

<br>

## Nest에서 제공하는 Built-in pipes

`NestJs`에서는 바로 사용할 수 있는 `Built-in`파이프 들을 제공해준다. 해당 `pipe`들은 `@nestjs/common` 안에 들어있다.

`Build-in`으로 제공해주는 `pipe`들의 종류는 [built-in pipes](https://docs.nestjs.com/pipes#built-in-pipes)에서 확인할 수 있다.

<br>

## Binding pipes

`pipe`를 사용되는 level은 네가지로 나눠질 수 있다.

- controller-level pipe

- Handler-level pipe

- parameter-level pipe

- Global-level pipe

<br>

### Controller-level Pipe

컨트롤러 레벨에서 `@UsePipes()` 데코레이터를 이용하면 현재 컨트롤러에 정의되어 있는 모든 **핸들러에 `pipe`가 적용된다.**

```ts
@Controller('cats')
@UsePipes(ValidationPipe)
export class CatsController {
  //...
}
```

<br>

### Handler-level Pipe

핸들러 레벨에서 `@UesPipes()` 데코레이터를 이용하여 사용할 수 있다. 핸들러 레벨에서 `pipe`를 사용하게 될 경우 핸들러의 **모든 파라미터에 적용이 된다.**

```ts
@Post()
@UsePipes(ValidationPipe)
saveCatInfo(@Body() req: CreateCatDto) {
    //...
}
```

<br>

### parameter-level pipe

파라미터 레벨의 `pipe`이기 대문에 **특정한 파라미테에만 적용이 되는**`pipe`이다.

```ts
@Get('/:id')
findById(@Param('id', ParseIntPipe) id: number) {
    //...
}
```

<br>

### Global-level pipe

애플리케이션이 `bootstrap`되는 `main.ts`에서 설정이 가능하다. 

```ts
@filename(main.ts)
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(3000);
}
bootstrap();
```

위와 같이 `app.useGlobalPipes`에 `ValidationPipe`를 생성하여 인스턴스를 넣어주면 된다.

하지만 위의 `code`의 경우 **의존성 주입**관점에서 `main.ts`에 직접 선언해주기 때문에 `code`가 유연하지 않다. 추 후 `GlobalPipes`가 변경될 경우 `main.ts`를 수정해주어야 한다.

`NestJs`에서는 위와 같은 방법 말고 `root Module`에서 `Custom Provider`를 이용하여 `GlobalPipes`를 등록할 수 있는 방법을 제공해준다.

```ts
@filename(app.module.ts)
@Module({
  imports: [CatsModule],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe
    }
  ],
})
export class AppModule { }
```

이렇게 `CustomProvider`로 정의를 해주게 되면 `GlobalPipes`로 사용할 `pipe`가 변경되더라도 유연하게 대채할 수 있게 된다.


<br>

## pipe를 통과하지 못하면 어떻게 될까?

[parameter-level pipe](#parameter-level-pipe)를 예로 살펴보자. 먼저 `pipe`를 정의하지 않고 `id`값에 `number`가 아닌 `string`값을 보내보겠다.

```ts
@Get('/:id')
findById(@Param('id') id: number) {
    console.log(id); // output = leewoooo
    console.log(typeof id); // output = string
}

// curl
curl -XGET http://localhost:3000/leewoooo
```

결과는 어떻게 되었을까? 콘솔에는 `leewoooo`가 찍히게 된다. 파라미터의 타입을 `number`로 정의하였지만 넘어오는 값은 `string` 타입의 `leewoooo`라는 값이 넘어오게된다.

이렇게 되면 나는 해당 값이 맞게 들어왔는지 **검증하는 로직을 추가로 작성해야 할 것이다.**

<br>

이번에는 `pipe`를 정의하여 동일하게 요청을 보내보자.

```ts
@Get('/:id')
findById(@Param('id', ParseIntPipe) id: number) {
    console.log(id); // output = leewoooo
    console.log(typeof id); // output = string
}

// curl
curl -XGET http://localhost:3000/leewoooo
{
    "statusCode":400,
    "message":"Validation failed (numeric string is expected)",
    "error":"Bad Request"
}   
```

이와 같이 핸들러가 **호출되기 전에** `pipe`에서 검증 후 발생한 예외에 대해 `response`를 받게된다. (추 후 `Exception filter`를 다룰 때 `pipe`에 대한 예외처리도 같이 정리하겠다.)

<br>

## custom pipe 만들기

### `PipeTransform`알아보기

글 초장에도 작성을 했지만 `NestJs`는 `pipe`를 `@Injectable` 데코레이터를 가지고 있으며 `PipeTransfrom`을 구현한 class라고 설명하고 있다.

즉 `PipeTransfrom`을 구현한 `Provider`라고 생각할 수 있다. `PipeTransfrom`는 아래와 같은 method를 가지고 있다.

```ts
//PipeTransfrom
export interface PipeTransform<T = any, R = any> {
    transform(value: T, metadata: ArgumentMetadata): R;
}

// ArgumentMetadata
export interface ArgumentMetadata {
    readonly type: Paramtype; // 'body' | 'query' | 'param' | 'custom';
    readonly metatype?: Type<any> | undefined;
    readonly data?: string | undefined;
}
```

`transfrom()`에서 `value`는 Client에서 보낸 data가 아직 **핸들러에 전달 되기 전의 data**이며 `metadata`는 `value`에 대한 metaData를 가지고 있다.

| 프로퍼티 명 | 정의 |
| :--- | :--- |
| `type` | `@body()`, `@query()`, `@param()` 또는 `사용자 정의 매개변수`인지 나타낸다. |
| `metatype` | `value`의 metaType을 제공한다. |
| `data` | 데코레이터에 전달된 문자열에 해당된다. `@Param('id')`인 경우 'id'가 넘어온다. |

<br>

### `ParseIntPipe`를 만들어보기

class를 하나 만들고 `PipeTransform` interface를 구현하기만 하면 `pipe`로 사용할 수 있는 class가 된다. 

사용을 할 때는 class의 **인스턴스**를 이용하여 `pipe`를 정의하면 된다.

```ts
@filename(parse-int.pipe.ts)
@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    // data transform
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      // validation
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}

// controller
@Get('/:id')
findById(@Param('id', new ParseIntPipe()) id: number) {
    //...
}
```

<br>

## Class validator

`NestJs`는 `class-validator` 라이브러리를 이용하여 데코리에터 기반 유효성 검사를 사용할 수 있다.

필요한 패키지는 아래와 같다.

```zsh
yarn add class-validator class-transformer
```

위의 두 개의 패키지와 `Nesjs`의 `pipe`가 결합될 때 Client가 요청하는 `RequestBody`에 대한 `validate`가 강력해진다.

<br>

### Usage

먼저 Client가 보내는 `RequestBody`에 해당하는 `dto` class를 정의한 후 `class-validator` 패키지의 데코레이터를 이용하여 `validate`할 프로퍼티 위에 선언해준다.

```ts
import { IsInt, IsString } from "class-validator";

export class CreateCatDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;
}
```

데코레이터의 이름에서 알 수 있듯이 해당 데코레이터가 무슨 역할을 하는지 직관적으로 보여준다. 예를 들어 `@IsString()`에 해당하는 데코레이터는 해당 프로퍼티가 `string`인지 `validate`하는 역할을 한다.

<br>

이 후 `pipe`를 작성하여 `class-validator`를 이용하여 `validate`한 프로퍼티에 대한 `error`가 발생하였는지 확인해준다.

```ts
@Injectable()
export class ClassValidation implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    // 1
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 2
    const object = plainToClass(metatype, value);
    // 3
    const errors = await validate(object);

    // 4
    if (errors.length > 0) {
      errors.forEach((e) => console.log(e.toString()))
      throw new BadRequestException('Validation failed');
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Number, Boolean, Array, Object];
    return !types.includes(metatype);
  }
}
```

위의 `code`를 정리하자면 다음과 같다.

1. `class-validator`이기 때문에 사용자 정의 타입 (class)가 아닌 경우 `value`를 그대로 `return`해준다. 
`RequestBody`가 `value`로 넘어올 때 `Controller`에서 정의해준 `type`으로 `metaType`이 들어오게 된다.

2. 공식문서에 따르면 `RequestBody`로 들어온 `pure javascript object`를 `type object`로 변환해주는 과정이다.
이 과정을 통해 `class-validator`를 이용하여 `validate`를 할 수 있는 상태가 되는 것이다.

3. `async`가 붙은 이유는 `NestJs`가 동기 및 비동기 파이프를 모두 지원하기 때문이다. 일부의 `class`를 `validate`할 때 **비동기 일 수 있기 때문이다.**

4. 마지막으로 `validate()`를 호출하면 `ValidationError[]`가 return되는데 `error`가 존재하면 배열에 `error`가 담겨있고 그렇지 않으면 빈 배열이 `return`된다.

<br>

사실 위에 작성한 `ClassValidation`은 `NestJs`에서 `built-in`으로 제공해주는 `ValidationPipe`의 내부 구조와 거의 비슷하다. 
확인을 해보고 싶다면 [ValidationPipe](https://github.com/nestjs/nest/blob/master/packages/common/pipes/validation.pipe.ts)에서 확인이 가능하다.

<br>

## 정리

`pipe`의 사용법 및 `Custom Pipe`를 작성하는 방법을 알아봤다.

`pipe`를 알기 전까지는 Client에서 넘어오는 `Data`들에 대한 `validation`하는 부분들에 대해 `Controller`나 `Service` 레이어에서 처리를 한 후 비지니스 로직에서 값을 사용했었다.

하지만 `NestJs`에서 `pipe`를 이용하여 `validation`하는 부분의 관심사를 분리할 수 있게 되었다. 그렇기 때문에 `controller`나 `service` 레이어에서 각 해당하는 **역할**에만 집중할 수 있게 되었다.

<br>

## Reference

- https://docs.nestjs.com/pipes#global-scoped-pipes
