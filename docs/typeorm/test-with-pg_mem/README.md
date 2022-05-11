# TypeORM + Postgres Test하기(with pg-mem)

예제 코드 및 Test 내용은 [Github](https://github.com/leewoooo/blog-code/tree/main/hello-typeorm/src/users)에서 확인할 수 있습니다:)

## Goal

- TypeORM을 실제 Database를 사용하지 않고 In-memory DB를 이용하여 Test하기 (docker와 실제 database 없이)

- `@nestjs/Test` 라이브러리를 이용하여 Module Test하기

<br>

## Why?

`CI`를 진행할 때 실제 Database에 Connection을 맺어 Test를 할 수 없다. (~~가능을 하겠지만.. 해서는 안된다.. 이전에는 CI를 돌릴 때 스크립트에 Docker를 이용하여 DB를 직접 띄워 CI를 돌린 적이 있다.~~)

또한 local에서 개발을 할 때는 Docker를 이용하여 DB에 붙어서 작업을 할 수 있지만 Test 환경에서는 항상 local처럼 Docker와 함께할 수 없다고 생각했다.

그렇다면 Test를 할 때 `sqllite`를 이용하여 `In-memory`로 형식으로 Test를 진행 할 수 있지만 현재 테스트의 대상은 `pg`이다.

간단하게 `Column type`에도 차이가 있기 때문에 `sqllite`말고 `pg`를 `In-memory`로 사용할 수 있을까 하다 라이브러리 하나를 찾게 되었다.
(`sqllite`에는 `pg`의 `timestamptz`와 같은 타입이 존재하지 않는다. 이렇게 되면 정확한 Test가 힘들어진다.)

그렇게 찾게된 라이브러리가 [pg-mem](https://github.com/oguimbal/pg-mem)이다.

<br>

## How?

[pg-mem](https://github.com/oguimbal/pg-mem)의 doc에 들어가면 `TypeORM`의 `Connection`을 맺는 방법을 설명해주고 있다.

[pg-mem(TypeORM)](https://github.com/oguimbal/pg-mem/wiki/Libraries-adapters#-typeorm)에 친절하게 code까지 설명해주고 있지만 wiki에 나와있는 대로 사용을 하게 되면 아래와 같은 Error를 만나게 될것이다.

```bash
QueryFailedError: ERROR: function current_database() does not exist
HINT: Please note that pg-mem implements very few native functions.
You can specify the functions you would like to use via "db.public.registerFunction(...)"

This seems to be an execution error, which means that your request syntax seems okay,
but the resulting statement cannot be executed → Probably not a pg-mem error.

Failed SQL statement: SELECT * FROM current_database();
```

<br>

그 이유는 TypeORM의 `synchronize` 옵션을 `true`로 주거나 `Connection`을 이용하여 `connection.synchronize()`를 할 때 **내부적으로 현재 `sync`를 하게 될 database를 조회하게 된다.**

그렇기 때문에 위 Error에서 볼 수 있듯 `Failed SQL statement: SELECT * FROM current_database();`가 나오게 되는 것이다.

<br>

### 해결법

Error의 Hint에서 볼 수 있듯이 `pg-mem` 라이브러리 중 `db.public.registerFunction()`를 이용하여 해당 Query문의 결과를 **조작할 수 있다.**

```ts
//...
beforeAll(async () => {
  db = newDb();
  db.public.registerFunction({
    name: "current_database",
    implementation: () => "test",
  });

  connection = await db.adapters.createTypeormConnection({
    type: "postgres",
    entities: [Companies],
    // option 1
    synchronize: true,
  });

  // option 2
  // await connection.synchronize();
});
//...
```

<br>

## Usage

사용법을 알아보자 :)

### TypeORM의 흐름 (with Nestjs)

위와 같이 하게 되면 `TypeORM`의 `Connection`을 얻을 수 있다. 얻어온 `Connection`을 Test에 사용해보자.

기본적으로 `Nestjs`에서 `TypeORM`을 사용하는 방법은 `TypeOrmModule.forRoot()`를 이용하여 `Module`에 등록을 하게 된다. (Root Module에 Import 했다는 가정하에 글을 작성하겠다.)

`TypeOrmModule.forRoot()`를 하게 되면 Provider로 `TypeORM`의 `Connection`이 등록되게 된다.<br>
(Import되는 `TypeORM Module`이 `Connection`이 아니라 `TypeORM Module`이 Import되면서 `Connection`이 Provider로 등록된다. )

이 후 `TypeOrmModuel.forFeature()`를 이용하여 Entity에 해당하는 Repository를 import 받을 수 있다.

<br>

### 중간에 만난 Error

`beforeAll`에서 위와 같이 `pg-mem`으로 `Connection`을 얻어온 이 후 `@nestjs/test` 라이브러리를 이용하여 `Module`를 만들어 Test를 진행하려 하면 아래와 같은 Error를 만난다. ([해결법](#해결법)의 예시 코드와 이어집니다.)

```ts
// try
beforeEach(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [TypeOrmModule.forFeature([Users])],
    providers: [UsersService], //2,
  });

  service = moduleRef.get<UsersService>(UsersService); //4
});
```

```bash
// error
Nest can't resolve dependencies of the ${TypeORM Repository} (?). Please make sure that the argument Connection at index [0] is available in the TypeOrmModule context.

Potential solutions:
- If Connection is a provider, is it part of the current TypeOrmModule?

- If Connection is exported from a separate @Module, is that module imported within TypeOrmModule?
  @Module({
    imports: [ /* the Module containing Connection */ ]
  })
```

<br>

그렇다.. **`pg-mem`을 이용해 `TypeORM`의 `Connection`을 얻어는 왔지만 Provider로 등록되지는 않은 상태이다.**

`pg-mem`으로 생성한 `Connection`을 이용하여 Test를 진행하려면 **`pg-mem`의 `Connection`을 Provider로 등록을 해줘야 한다.**

<br>

### 최종 사용법

`@nest/test`라이브러리를 이용하여 `Module`를 만들 때 `Connection`을 바꿔끼는 방법을 알아보자면 아래와 같다. ([해결법](#해결법)의 예시 코드와 이어집니다.)

```ts
beforeEach(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [TypeOrmModule.forRoot(), TypeOrmModule.forFeature([Users])], //1
    providers: [UsersService], //2,
  })
    .overrideProvider(Connection) //3
    .useValue(connection) //3
    .compile();

  service = moduleRef.get<UsersService>(UsersService); //4
});
```

<br>

1. 아무런 option도 주지 않은 `TypeOrmModule.forRoot()`를 이용하여 `Connection`을 Provider로 등록한다.

2. Test의 대상이 되는 혹은 Test의 대상이 주입받고 있는 Provider들을 넣어준다.

3. `TypeOrmModule.forRoot()`로 등록한 `Connection` Provider를 `pg-mem`을 이용하여 생성한 `Connection`으로 `override`해줍니다.

4. 생성 된 `Module`에서 필요한 Provider를 꺼내서 사용한다.

<br>

## pg-mem backup, restore

Database Test를 진행하다 보니 하나의 테스트가 끝날 때 마다 Database를 초기화 시켜주거나 `Rollback`시키지 않으면 각각의 테스트가 **의존성을 가지게 된다.**

`Spring`에서는 테스트 마다 `@Transactional`이라는 어노테이션을 이용하여 각 테스트가 끝날 때 마다 `Rollback`을 시킬 수 있는데 `Nestjs` 혹은 `Nodejs`에서는 직접 구현해서 진행해줘야 한다. (혹시 좋은 방법이 있다면 댓글 부탁드립니다.)

`Jest`에서 `afterEach`, `beforeEach`등과 같이 lifecycle을 제공해준다. `afterEach`에서 DB를 `TRUNCATE` 처리를 하여 테이블을 `clear`해주었다.

`TypeORM`에서는 `repository`를 얻어와 `clear()` 메소드를 이용하면 해당 테이블을 초기화 할 수 있었다. 하지만 `pg-mem`을 이용한 **테스트에서는 통하지 않는다** 역시 호락호락하지 않다..

```ts
usersRepository.clear(); // 호출 해도 메모리 DB의 테이블이 초기화 되지 않음.
```

<br>

그 이유는 [Rollback to a previous state](https://github.com/oguimbal/pg-mem/blob/master/readme.md#rollback-to-a-previous-state)에서 설명을 하고 있다. 내부적으로 `immutable`을 이용하고 있기 때문에 **변경할 수 없는 데이터 구조를 가진다는 것이다.**

### 해결법

DB를 `init`하는 부분에서 `backUp`을 만들고 `afterEach`에서 해당 시점으로 돌아가는 `restore()`를 호출해주면 된다.

```ts
let backup: IBackup;

beforeAll(async () => {
  // setting memory database
  const db = newDb();
  db.public.registerFunction({
    name: "current_database",
    implementation: () => "test",
  });

  //...
  backup = db.backup();
});

afterEach(async () => {
  backup.restore();
});
```

<br>

위와 같이 진행하면 테스트를 진행할 때 마다 **DB를 `init`한 시점으로 돌아가서 사용하게 되며 각 Database 테스트마다 의존성을 제거할 수 있게 된다.**

<br>

## Reference

- https://docs.nestjs.com/fundamentals/testing#testing

- [TypeORM issue #148](https://github.com/matheusalxds/clean-architecture-with-nestjs/blob/main/test/infra/db/pg/helper/pg-helper.ts)
