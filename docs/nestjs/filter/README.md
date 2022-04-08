# NestJs filter (with Java)

## Goal

- `NestJs`의 filter에 대해 알아보기

- `CustomException`을 구현한 후 해당 `Exception`을 `Catch`하는 `filter`만들기


<br>


## filter란?

`NestJs`에서는 애플리케이션 전체에서 처리되지 않은 모든 예외(Exception)를 처리하는 **예외 레이어**가 내장되어 있다. 애플리케이션 코드에서 처리되지 않는 예외는 **예외 레이어**계층에서 **예외를 포작한 다음 자동으로 적절한 사용자 친화적인 응답을 보낸다.**

<img src = https://docs.nestjs.com/assets/Filter_1.png>

<br>

기본적으로 이 동작은 내장 된 **전역 예외 필터**에 의해 수행되게 되는데, 이 예외는 `HttpException`유형의 예외를 처리한다. 예외가 `unrecognized`인 경우(`HttpException`혹은 `HttpException`을 상속 받는 class가 아닌 경우) Client는 다음과 같은 기본 JSON을 받게 된다.

```zsh
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

<br>

## Base Exception

내장된 `HttpException` class는 `@nestjs/common`에서 제공을 한다. 먼저 `HttpException`의 구조를 확인해보자면 아래와 같다.

```ts
export declare class HttpException extends Error {
    private readonly response;
    private readonly status;

    constructor(response: string | Record<string, any>, status: number);
    initMessage(): void;
    initName(): void;
    getResponse(): string | object;
    getStatus(): number;
    static createBody(objectOrError: object | string, description?: string, statusCode?: number): object;
}
```

`Error`를 상속받고 있으며 프로퍼티로는 `response`와 `status`를 가지고 있다. `response`의 역할과 `status`의 역할은 다음과 같다.

- response: Client에게 응답이 되는 JSON의 본문을 정의하는 곳이다.

- status: HTTP 통신의 상태값을 결정한다.

기본적으로 Client에게 응답이 되는 JSON은 두 가지의 기본속성을 가지고 있다.

```
{
    "statusCode": ,
    "message" : 
}
```

위에서 `response`의 타입이 `string | Record<string, any>`인 것을 볼 수 있을 것이다.

<br>

만약 기본 응답에서 `message` 부분만 변경하고자 하면 `HttpException`을 생성할 때 `string`를 넣어주면 된다.

```ts
throw new HttpException('BadRequest', HttpStatus.BAD_REQUEST);

// output
{
    "statusCode": 400,
    "message": "BadRequest"
}
```

<br>

`message`말고 응답이 되는 JSON 전체를 재정의하고 싶으면 객체를 넣어주면 된다.

```ts
//2
const response: Record<string, any> = {
    'status': HttpStatus.BAD_REQUEST,
    'errorMessage': 'BadRequest'
}
throw new HttpException(response, HttpStatus.BAD_REQUEST);

// output
{
    "status": 400,
    "errorMessage": "BadRequest"
}
```

<Br>

## Exception hierarchy

**예외 계층 구조**를 직접 만드는 것이 좋다. 예외 계층 구조를 만든다는 것은 `HttpException`을 상속받아 `Exception`을 `Custom`하는 것을 이야기 한다. 직접 만들어 보면 아래와 같다.

```ts
export class CustomHttpException extends HttpException {
  // 여기서 생성자로 미리 정의해둔 상수 혹은 객체를 받아 부모의 생성자에 넣어준다.
  constructor(response: string | Record<string, any>, status: HttpStatus) {
    super(response, status);
  }
}
```

<br>

[이전에](https://github.com/leewoooo/todoList/blob/main/todo/src/main/java/leewoooo/todo/exception/todo/CustomHttpException.java) `Java`를 이용하여 `CustomHttpException`을 작성했을 때와 크게 다르지 않음을 볼 수 있다. `Java`에서는 `RuntimeException`을 상속받아 `CustomException`을 작성했었다.

```java
@Getter
public class CustomHttpException extends RuntimeException{
    private final ErrorCode errorCode;

    public CustomHttpException(ErrorCode errorCode){
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
```

<br>

### Nest에서 제공해주는 built-in HttpException

`Nest`에서는 상용구 코드를 작성할 필요성을 줄이기 위해 `@nestjs/common`에서 여러가지 `HttpException`의 종류들을 제공해준다.

종류는 [Built-in HttpException](https://docs.nestjs.com/exception-filters#built-in-http-exceptions)에서 확인할 수 있다.

<br>

## Exception filter 만들기

내장 예외 필터를 이용하여도 많은 경우를 자동으로 처리할 수 있지만 우리가 원하는 것은 **자동으로 처리되는 것이 아니라 커스텀하기를 원한다!** 

이번 경우 또한 [이전에](https://github.com/leewoooo/todoList/blob/main/todo/src/main/java/leewoooo/todo/controller/exception/CustomExceptionHandler.java) `Java`에서는 `@RestControllerAdvice`와 `@ExceptionHandler()` 어노테이션을 이용하여 `Exception Handler`를 만들었다.

```java
@RestControllerAdvice
public class CustomExceptionHandler {
    @ExceptionHandler(CustomHttpException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomHttpException e) {
        //...
    }
}
```

<br>

`NestJs`에서 `Java`의 `ExceptionHandler`와 같이 지정한 `exception`이 발생할 때 해당 `Exception`에 대한 응답을 커스텀 할 수 있도록 `Exception Filter`를 정의할 수 있다.

`Exception Filter`를 만들려면 `ExceptionFilter` 인터페이스를 구현하여 `catch()`안에서 해당 `Exception`에 대한 응답을 처리할 수 있다.

```ts
// 제네릭을 통해 `Exception`의 타입을 지정해 줄 수 있다.
export interface ExceptionFilter<T = any> {
    catch(exception: T, host: ArgumentsHost): any;
}
```

`ArgumentsHost` 인터페이스는 아래와 같은 method들을 가지고 있다.

```ts
export interface HttpArgumentsHost {
    /**
     * Returns the in-flight `request` object.
     */
    getRequest<T = any>(): T;
    /**
     * Returns the in-flight `response` object.
     */
    getResponse<T = any>(): T;
    getNext<T = any>(): T;
}

export interface ArgumentsHost {
    getArgs<T extends Array<any> = any[]>(): T;
    getArgByIndex<T = any>(index: number): T;
    switchToRpc(): RpcArgumentsHost;
    switchToHttp(): HttpArgumentsHost;
    switchToWs(): WsArgumentsHost;
    getType<TContext extends string = ContextType>(): TContext;
}
```



