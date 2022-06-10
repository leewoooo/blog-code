# TypeOrm에서 Transaction 이용해보기

## Goal

- TypeORM에서 Transaction을 사용하는 방법을 알아보기
- TypeORM의 Transaction을 pg-mem을 이용해 테스트가 가능할까

## TypeORM에서 트랜잭션을 사용하는 방법

TypeORM에서는 트랜잭션을 3가지 방법으로 사용을 하고 있다.

1. `QueryRunner`를 이용하여 단일 DB 커넥션 상태를 생성하고 관리

2. `transaction` 객체를 생성해서 이용하는 방법

3. `@Transaction`, `@TransactionManager`, `@TransactionRepository` 데코레이터 사용

[Nest Database Transaction](https://docs.nestjs.com/techniques/database#transactions)를 참조하면 위의 3가지 방법 중 3번 방법은 `Nest`에서 권장하지 않고 있다.

<br>

## 사용법

현 시점에서 최신의 `@nestjs/typeorm`에서는 `TypeORM`의 버전을 `0.3.x`를 이용하고 있으나 해당 글에서는 `^0.2.45`를 기준으로 작성할 것이다.

<br>

### `QueryRunner`를 사용하기

`QueryRunner`를 이용하려면 먼저 `Connection`을 `Injection`받아야 한다. Root에서 `TypeOrmModule`를 import 받고 있다면 하위 `Module`에서는 생성자를 통해 `DI`받을 수 있다.

```ts
@Injectable()
export class UsersService {
  constructor(
    // ...
    private readonly connection: Connection
  ) {}
  // ...
}
```

주입 받은 `Connection`을 이용하여 트랜잭션을 생성하여 사용하는 방법은 아래의 코드와 같다.

```ts
async saveWithQueryRunner(user: Users){
  const queryRunner = this.connection.createQueryRunner(); // 1

  await queryRunner.connect(); // 2
  await queryRunner.startTransaction(); // 3

  try {
    const saved = await queryRunner.manager.save(user);
    //...
    // throw new InternalServerErrorException();
    await queryRunner.commitTransaction(); // 4
  } catch (e) {
    await queryRunner.rollbackTransaction();// 5
  } finally {
    await queryRunner.release(); // 6
  }
}
```

1. 주입받은 `Connection`을 통해 `QueryRunner` 인스턴스를 생성한다.

2. 생성된 `QueryRunner`를 이용하여 `connection`을 가져옵니다. 주석을 확인해 보면 작업을 수행하기 위해 `pool`에서 생성을 하거나 `pool`에 있는 Connection을 이용합니다.

3. 트랜잭션을 시작한다. 시작할 때 인자로 트랜잭션 격리 level을 설정할 수 있다.

4. 트랜잭션 작업이 전부 완료 되면 `commit`함으로 변경 내역을 DB에 **영속화 한다.**

5. 만약 트랜잭션 작업 중 Error가 발생하면 `rollback`을 함으로 트랜잭션이 시작되기 이전 시점으로 되돌립니다.

6. 트랜잭션이 **성공 여부에 상관없이 가져다 사용한 resource를 반납해준다.**

<br>

### `transaction` 객체를 생성해서 이용하는 방법

`QueryRunner`와는 다른 방법으로 `Connection`에서 `transaction` 메서드를 바로 이용하는 방법도 있다.

```ts
/**
 * Wraps given function execution (and all operations made there) into a transaction.
 * All database operations must be executed using provided entity manager.
 */
transaction<T>(runInTransaction: (entityManager: EntityManager) => Promise<T>): Promise<T>;
```

`transaction` 메서드로 들어오는 함수는 `transaction`으로 래핑되어 실행되며 함수 안에서 `repository`를 이용하는 것이 아니라 `entityManager`를 이용하여 DB를 조작해야 한다.

```ts
async saveWithTransactionMethod(user: Users) {
  await this.connection.transaction<Users>(async (em: EntityManager) => { // 1
    const saved = await em.save(user);
    // throw new InternalServerErrorException();
    return saved;
  });
}
```

1. `transaction`메소드는 `entityManager`를 인자로 받는 콜백안에서 트랜잭션 작업단위를 작성하여 실행시킨다. 만약 트랜잭션 격리 level을 진행하고 싶다면 첫번 째 인자로 지정을 해주면 된다.

<br>

## Pg-mem으로 Transaction Test가 가능할까?

[이전 글](https://velog.io/@dev_leewoooo/Node-Project-CI-%ED%95%98%EA%B8%B0-with-Github-Action)에서 Pg-mem을 이용하여 CRUD를 Test하는 방법에 대해 알아보았다.

해당 방법으로 `TypeORM Connection`을 생성하여 트랜잭션 테스트를 진행하려고 하다 보니 문제가 발생하였다.

```ts
it("pg-mem 트랜잭션 테스트", async () => {
  //given
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const newUsers = new Users();
  newUsers.name = "foobar";
  try {
    await queryRunner.manager.save(newUsers);
    throw new InternalServerErrorException();
  } catch (e) {
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }

  //when
  const queryRunner2 = connection.createQueryRunner();
  await queryRunner.connect();
  const result = await queryRunner2.manager.find(Users);

  //then
  expect(result.length).toBe(1);
  expect(result[0].name).toBe("foobar");
});
```

테스트 코드는 위와 같은데 중간에 `exception`을 터트려 강제적으로 `RollBack`을 하는 시나리오를 작성하였다.

**하지만!** 결과는 예상과 다르게 `Rollback`이 되지 않고 그대로 `Insert`가 되었다. 그래서 `query`를 실행하는 `log`도 찍어보았다.

<img src = https://user-images.githubusercontent.com/74294325/173000170-3607a690-c3d1-4fcd-8047-6a745e6b26bf.png>

<br>

사진과 같이 `ROLLBACK` query를 실행하기는 하지만 `pg-mem`내부적으로 `ROLLBACK`이 되지는 않는다. 해당 라이브러리 repository에 issue를 찾아보니 기본적으로 `ROLLBACK`은 지원하지 않는 것 같다. [pg-mem #107](https://github.com/oguimbal/pg-mem/issues/107)

만약 트랜잭션 로직에 대한 테스트를 하고자 한다면 다른 방법을 찾아봐야 할 것이다. (후속 편에 작성할 예정)

<br>

## REFERENCE

- https://docs.nestjs.com/techniques/database#transactions

- https://wikidocs.net/158616

- https://github.com/oguimbal/pg-mem
