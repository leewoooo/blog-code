# Transactional 데코레이터 만들기 (with NestJs MeetUp 1st)

현재 글은 `TypeORM`을 기준으로 작성되었지만 내부 구조가 비슷한 `ORM`에서는 대부분 적용이 가능합니다. (`Mikro-orm`에서도 테스트를 완료했습니다.)

## Goal

- ORM에서 사용할 `@Transactional`만들기

<br>

## 왜 만들게 되었나?

충분히 `TypeORM`에서 제공을 해주는 기능을 가지고 트랜잭션을 사용할 수 있다. `NestJs`에서도 `TypeORM`으로 트랜잭션을 사용하는 방법을 설명해주고 있다.

[Transaction With TypeORM](https://docs.nestjs.com/techniques/database#typeorm-transactions)에서 보면 `DataSource`를 주입받아 해당 인스턴스에서 `createQueryRunner`를 만들고 트랜잭션을 처리하는 것을 볼 수 있을 것이다.

생성된 `queryRunner`를 통해 `CRUD`작업을 하고 `Rollback`, `Commit`를 진행할 수 있다. 하지만 대부분 Serviec Layer에서 Repository를 주입받아 사용하며 ORM을 사용하고 있다면 되부분 구현된 Repository를 주입받아 따로 CRUD 로직을 구현하지 않는다.

위와 같은 로직에서 Transaction을 처리하려고 하다보면 "각 Repository에서의 `queryRunner`는 어떻게 공유할 수 있을까?" 의문이 생겼다.
Method 파라미터로 `queryRunner`를 넣어줄 수 있겠지만 그럼 트랜잭션 안에서 처리되어야 하는 Method와 처리되지 않는 Method 2개를 만들어야 하는 것인가? (이런 일은 있어서는 안된다.)

또한 Service Layer에서 추상화 된 Repository가 아닌 `DataSource`를 불러와 처리해야한다는 것이 Serviec Layer와 Repository Layer의 경계를 모호하게 만들며 하나의 Service Method가 뚱뚱해지는 문제를 경험하고 있었다.

위와 같은 문제를 해결하고자 `@Transactional`이라는 데코레이터를 만들기로 하였다.

<br>

## Cross-cutting concern, AOP

NestJs MeetUp 1st의 마지막 세션을 들으면 이러한 문제를 해결한 경험을 공유해주는 세션이 나오게 된다.

> 트랜잭션이라고 하는 것은 `Cross-cutting concern` 대표적인 사례이다. 횡단 관심사는 특정한 계층이나 문제 영역에 국한된 것이 아니라 여러 곳에 반복적으로 나타나는 문제이다. 이러한 문제를 `AOP`라는 페러다임을 통해 해결할 수 있다. - NestJs MeetUp 1st

AOP를 간단하게 설명하면 코드를 수정하는 것이 아닌 작성되어 있는 코드에 Hint와 같은 Code를 작성하여 내부의 동작을 변화시키는 개념이다.

위와 같은 개념을 적용하여 `@Transactional` 데코레이터를 만들어보자.

<br>

## 개요

NestJs MeetUp 1st에서 이것을 구현하기 위해 Spring Framework를 모방하였다고 했다. (~~스프링이 정답인가~~)

Spring에서는 Annotation이지만 TypesScript에서는 Decorator를 이용하여 구현할 수 있다.

<img src = https://user-images.githubusercontent.com/74294325/200265449-13187889-c999-4c28-8f02-d0c3d95ddc17.png>

<br>

개요를 간단하게 설명하면 요청이 들어오면 scope를 만들고 해당 scope에서 트랜잭션을 열어 사용한 후 scope가 닫힘과 동시에 커밋을 한 후 응답을 해주는 흐름이다.

쓰레드 기반 언어에서는 특정 쓰레드만 접근을 할 수 있는 `localstorge`와 같은 개념이 있는데 `Nodejs`의 경우에는 쓰레드가 없다보니 `localstorge`를 유사하게 구현해 놓은 `cls-hooked`를 이용한다.

`cls-hooked`를 이용하면 요청이 들어오면 `Context`에서만 접근이 가능한 NameSpace를 만들고 해당 요청에 대한 `Context`는 생성된 NameSpace를 이용하여 데이터나 인스턴스를 공유할 수 있게 된다.
