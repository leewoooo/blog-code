# TypeORM Transaction을 Test하기

예제코드는 [Github](https://github.com/leewoooo/blog-code/tree/main/hello-typeorm/src)에 있습니다:)

## Goal

- TypeORM의 queryRunner를 이용하여 Transaction을 이용하였을 때 `jest`를 이용하여 Test 해보기

<br>

## Version

현 시점에서 최신의 `@nestjs/typeorm`에서는 `TypeORM`의 버전을 `0.3.x`를 이용하고 있으나 해당 글에서는 `^0.2.45`를 기준으로 작성할 것이다. (차이점은 `Connection`을 이용하는 것과 `DataSource`를 이용하는 것이다.)

<br>

## Why

[이전 글](https://velog.io/@dev_leewoooo/TypeORM에서-Transaction을-이용해보기)에서 `pg-mem`을 이용하여 `TypeOrm` 트랜잭션을 테스트 할 수 있을 줄 알았지만 `pg-mem`에서 `ROLLBACK`을 지원하지 않아 실패하였다.

그렇기 때문에 `jest`를 이용하여 `QueryRunner`를 `Mocking`하여 Test를 진행하기로 하였다. Test를 하기 위해서 필요한 객체는 아래와 같다.

1. `QueryRunner` -> interface

2. `EntityManager` -> class

3. `Connection` -> class

<br>

### QueryRunner 대역 만들기

[이전 글](https://velog.io/@dev_leewoooo/TypeORM에서-Transaction을-이용해보기)에서 작성한 것과 동일하게 `createQueryRunner()`를 이용하여 트랜잭션을 사용하게 된다.

`QueryRunner`는 interface type이며 내부적으로 `manager`라는 프로퍼티를 가지고 있다.

```ts
// manager만 가지고 있는 것은 아니다.
export interface QueryRunner {
  /**
   * Entity manager working only with this query runner.
   */
  readonly manager: EntityManager;
}
```

`QueryRunner`는 아래의 코드처럼 간단하게 대역을 만들 수 있다.

```ts
const qr = {
  manager: {},
} as QueryRunner;
```

이 후 `QueryRunner`를 이용하여 트랜잭션을 사용하기 때문에 필요한 `method`를 `jest.fn()`을 이용하여 Mocking한다.

```ts
qr.startTransaction = jest.fn();
qr.commitTransaction = jest.fn();
qr.rollbackTransaction = jest.fn();
qr.release = jest.fn();
```

<br>

### EntityManager method Mocking하기

`QueryRunner`에 있는 `manager(EntityManager)`는 기본적으로 사용하는 CRUD method가 존재한다.

Test하고자 하는 코드에서 사용하는 method를 `Object.assign`을 통하여 `manager(EntityManager)`에 넣어준다. ([Object.assign](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/assign))

```ts
Object.assign(qr.manager, { save: jest.fn() });
```

<br>

### Connection 대역 만들기

`Connection`에서 `QueryRunner`를 생성하는 method의 syntax는 아래의 코드와 같다.

```ts
createQueryRunner(mode?: ReplicationMode): QueryRunner;
```

해당 method를 가지고 있는 MockConnection `class`를 만들어 준다. return 값은 `QueryRunner`인데 위에서 만든 `QueryRunner`의 대역을 return해주면 된다.

```ts
class ConnectionMock {
  createQueryRunner(mode?: "master" | "slave"): QueryRunner {
    return qr;
  }
}
```

<br>

### 최종적인 모습

위의 3개의 대상들을 Mocking하면 테스트 준비가 끝나게된다. 3개의 단계를 합치게 되면 아래와 같은 코드가 완성된다.

```ts
describe('Transaction Unit Test', () => {
  let usersService: UsersService;
  let connection: Connection;

  const qr = { // 1
    manager: {},
  } as QueryRunner;

  class ConnectionMock { // 2
    createQueryRunner(mode?: 'master' | 'slave'): QueryRunner {
      return qr;
    }
  }

  beforeEach(async () => {
    Object.assign(qr.manager, { save: jest.fn() }); // 3

    // 4
    qr.startTransaction = jest.fn();
    qr.commitTransaction = jest.fn();
    qr.rollbackTransaction = jest.fn();
    qr.release = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: Connection,
          useClass: ConnectionMock, // 5
        },
        {
          provide: getRepositoryToken(Users),
          useClass: Repository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    connection = module.get<Connection>(Connection);
  });

  //...
}
```

1. `QueryRunner`의 대역을 만든다.

2. `Connection`의 대역을 만든다.

3. Test를 할 때 필요한 `TypeORM` method를 Mocking한다.

4. 트랜잭션에 필요한 method들을 Mocking한다.

5. `Connection`의 대역을 `CustomProvider`를 이용하여 `Provider`로 정의한다.

<br>

## Test 하기

User를 트랜잭션과 함께 저장하는 로직은 아래와 같이 간단하게 작성하였다.

```ts
async saveWithQueryRunner(user: Users): Promise<Users> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const saved = await queryRunner.manager.save(user);
      //...
      await queryRunner.commitTransaction();
      return saved;
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
```

위의 코드를 검증하는 실패case와 성공case TestCode는 아래와 같다. (트랜잭션 테스트를 하는 것을 주제로 하고 있기에 `jest`에 대해서는 설명하지 않겠다.)

<br>

테스트 코드에서 중요하게 볼 것은 `const queryRunner = connection.createQueryRunner();`로 이전 테스트를 하기 위한 사전작업에서 정의한 `QueryRunner`를 가져오는 것, `manager`를 이용하여 CRUD method를 Mocking하는 것이다.

```ts
it("정상적으로 저장되는 경우", async () => {
  //given
  const now: Date = new Date();
  const willSavedUser: Users = {
    id: 1,
    name: "foobar",
    createdAt: now,
    lastModifiedAt: now,
  };
  const queryRunner = connection.createQueryRunner();

  jest.spyOn(queryRunner.manager, "save").mockResolvedValueOnce(willSavedUser);

  //when
  const result = await usersService.saveWithQueryRunner(new Users());

  //then
  expect(result).toStrictEqual(willSavedUser);
  expect(queryRunner.manager.save).toHaveBeenCalledTimes(1);
  expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  expect(queryRunner.release).toHaveBeenCalledTimes(1);
});

it("save 도중 Error가 발생하는 경우", async () => {
  //given
  const now: Date = new Date();
  const willSavedUser: Users = {
    id: 1,
    name: "foobar",
    createdAt: now,
    lastModifiedAt: now,
  };
  const queryRunner = connection.createQueryRunner();

  jest
    .spyOn(queryRunner.manager, "save")
    .mockRejectedValueOnce(new Error("DataBase Error 발생"));

  const result = await usersService.saveWithQueryRunner(new Users());

  expect(result).toBeUndefined();
  expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
  expect(queryRunner.release).toHaveBeenCalledTimes(1);
});
```

테스트를 실행하면 잘 동작하는 것을 확인할 수 있다.

<img src = https://user-images.githubusercontent.com/74294325/174007582-7bd5a32a-3c33-46b1-9b5c-afad262228f0.png>

<br>

## REFERENCE

- https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

- https://typeorm.io/

- https://stackoverflow.com/questions/63664322/how-to-use-jest-spyon-with-nestjs-transaction-code-on-unit-test
