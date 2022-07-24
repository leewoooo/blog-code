# TypeORM을 sqlite로 Test하기

## Goal

- pg의 타입을 이용하는 Entity에 대한 Unit Test를 sqlite를 이용하여 진행하기

<br>

## Why

이전 Database를 어떻게 Unit Test를 더 잘할 수 있을까에 대하여 생각을 하면서 적은 글들이 있다. 대표적으로는 2개의 글이 있다.

1. [TypeORM + Postgres Test하기(with pg-mem)](https://velog.io/@dev_leewoooo/TypeORM-Postgres-Test%ED%95%98%EA%B8%B0with-pg-mem)

2. [TypeORM Transaction을 Test하기 (with queryRunner)](https://velog.io/@dev_leewoooo/TypeORM-Transaction%EC%9D%84-Test%ED%95%98%EA%B8%B0-with-queryRunner)

하지만 위에서 작성한 글에는 아쉬운 부분들이 2가지가 있었다.

1. `pg-mem`은 `TypeORM Adaptor`를 제공하여 CRUD에 대하여 실제 DB처럼 Test는 할 수 있지만 **아쉽게도 트랜잭션 테스트는 진행할 수 없다.**

2. `QueryRunner`를 Mocking하여 트랜잭션까지 포함된 로직을 테스트를 할 수는 있지만 언제까지나 실제 DB처럼 테스트를 할 수 있는 환경을 구축하기는 어렵다. (Mocking이다 보니 로직을 검증을 할 수는 있지만 DB에 데이터에 대해서는 정확한 테스트를 할 수 없을 것 같다는 생각을 하였다.)

이 아쉬운 부분들을 어떻게 해결할 수 있을까? 고민을 하던 도중 인프런의 [강의실 개편](https://tech.inflab.com/202207-refactoring-legacy-code/?fbclid=IwAR2MQiKwSmFJqmgnGCdsgs61_5Q89z_4LhHCHEdcf6XAd8gmFIeOkjVoKk4#mikroorm)의 글 중 아래와 같이 적혀있는 글을 보고 힌트를 얻게 되어 시도해보았다.

> 빠른 테스트 속도를 위해서 sqlite 를 사용하려고 해도
>
> -- <cite> 강의실 개편 MikroORM </cite>

<br>

## Pg타입을 이용하는 Entity를 Sqlite에서 사용할 때 생기는 문제점

`Entity`에 `Column`를 정의할 때 데코레이터를 통해 타입을 지정할 수 있다. 대표적으로 Pg타입과 sqlite타입이 충돌하는 부분은 `timestamptz`같은 부분일 것이다.

`timestamptz`로 정의된 `Column`을 포함한 `Entity`를 `sqlite` 베이스의 `TypeORM`에서 사용하면 아래와 같은 Error를 확인할 수 있을 것이다.

```ts
DataTypeNotSupportedError: Data type "timestamptz" in "Users.createdAt" is not supported by "sqlite" database.
```

이 외에도 Pg타입과 sqlite 타입이 충돌하는 부분이 있다. 그렇기 때문에 `Entity`가 로드 되는 시점에 계속해서 문제가 발생할 것이다.

이 후 이 문제를 해결하는 방법을 가지고 `timestamptz` **이외에도 충돌하는 부분을 해결해 나갈 수 있을 것이다.**

**충돌을 해결한 이후에는 sqlite를 이용하여 `TypeORM`의 CRUD 및 트랜잭션 테스트를 할 수 있을 것이다.**

<br>

## 어떻게 해결할 수 있을까?

`CreateDateTime` 데코레이터를 기준으로 작성해 나갈 것이다. 이 데코레이터를 구현하는 코드를 까보면 내부적으로는 아래와 같다.

`CreateDateTime`의 라이브러리 코드를 살펴보면 아래와 같다.

```ts
export declare function CreateDateColumn(
  options?: ColumnOptions
): PropertyDecorator;
```

`ColumnOptions`를 파라미터로 받아 `PropertyDecorator`를 리턴한다. 그럼 `ColumnOptions`로는 어떠한 값들이 들어오는 걸까?

바로 `CreateDateTime` 데코레이터를 이용할 때 **인자로 넣은 값들이 들어오게 된다.**

```ts
@CreateDateColumn({ type: 'timestamptz', nullable: false })
createdAt: Date;
```

위와 같이 `createdAt`를 정의하면 `ColumnOptions`으로 `{ type: 'timestamptz', nullable: false }` 값들이 들어오게 되는 것이다.

<br>

위와 같은 구조라는 것만 알았다면 거의 끝이 난 것이다 :)

`TypeORM`라이브러리를 `jest`로 Mocking한 후 `CreateDateTime`만 직접 구현하여 바꿔주기만 하면된다. 직접 구현을 할 때 `timestamptz`로 들어오는 타입을 sqlite의 타입으로 변경하여 다시 `CreateDateTime`를 호출해주기만 하면 되기 때문이다.

더 자세한 구현 방법은 아래에서 하나씩 살펴보기를 원한다.

<br>

## 구현

구현에 앞서서 `jest`의 대한 이해가 필요합니다. 현재 글에서는 `jest`에 대한 설명은 제외하고 진행하겠습니다.

구현 순서를 정리하면 아래와 같다.

1. `TypeORM`을 `jest`를 통해 mocking하기

2. mocking한 `TypeOrm`의 내부를 `jest.requireActual`를 통해 채워주기

3. 해당 라이브러리의 변경하고 싶은 부분만 구현하여 바꿔껴주기 (여기서는 `CreateDateTime`를 구현하여 변경하여주겠습니다.)

<br>

### 1. `TypeORM`을 `jest`를 통해 mocking하기

`TypeORM`을 `jest`를 통해 mocking하는 것은 간단하다.

테스트 코드를 작성하기 전에 제일 상단에서 mocking을 하면 된다. 자세한 것은 [mocking-node-modules](https://jestjs.io/docs/manual-mocks#mocking-node-modules)를 참조하면 된다.

```ts
jest.mock("typeorm", () => {...});
```

<br>

### 2. mocking한 `TypeOrm`의 내부를 `jest.requireActual`를 통해 채워주기

[`TypeORM`을 `jest`를 통해 mocking하기](#1-typeorm을-jest를-통해-mocking하기) 단계에서 두번 째 인자로 mocking하려는 모듈의 내부 코드를 custom할 수 있다.

현재는 모듈의 모든 부분이 아닌 필요한 부분만 바꾸줄 것이기 때문에 `jest.requireActual`를 이용한다. `jest.requireActual`를 통해 실제 모듈을 받아 `Spread Opertor`를 이용해 넣어주면 된다. 사용법은 [jest.requireActual(moduleName)](https://jestjs.io/docs/jest-object#jestrequireactualmodulename)를 참조하자.

```ts
jest.mock("typeorm", () => {
  const realTypeORM = jest.requireActual("typeorm");
  return {
    ...realTypeORM,
  };
});
```

<br>

### 3. 해당 라이브러리의 변경하고 싶은 부분만 구현하여 바꿔껴주기

이제 필요한 부분을 custom하여 넣어주면 된다. 현재 글에서는 `CreateDateColumn`를 기준으로 작성을 하고 있으니 `CreateDateColumn`를 custom하겠다.

sqlite에서는 Date 관련 Column의 타입을 `datetime`으로 처리를 하고 있다. 그렇기 때문에 `ColumnOptions`으로 들어오는 `timestamptz`를 sqlite 타입인 `datetime`으로 변경해준 후 `CreateDateColumn`를 다시 호출해주면 된다.

```ts
jest.mock('typeorm', () => {
  const realTypeORM = jest.requireActual('typeorm');
  return {
    ...realTypeORM,
    CreateDateColumn: (options: ColumnOptions) => {
      options.type = 'datetime';
      return CreateDateColumn(options);
    },
    ...
  };
});
```

하지만 위와 같이 작성 후 테스트를 돌리면 아래와 같은 Error를 만날 수 있을 것이다.

```ts
● Test suite failed to run
RangeError: Maximum call stack size exceeded
```

즉 call stack이 터져버린 것이다. 그 이유는 `CreateDateColumn`를 구현할 때 `return`쪽에 `CreateDateColumn`를 호출하며 바뀐 `ColumnOptions`를 넣어주고 있다.

하지만 여기서 `return`쪽에서 호출되는 `CreateDateColumn`는 이미 우리가 custom한 `CreateDateColumn`가 호출되기 때문에 **재귀를 돌게 된다.** 재귀를 돌면서 계속 자기 자신을 호출하다가 call stack이 터져버린 것이다.

이것을 해결하기 위해서는 [mocking한-typeorm의-내부를-jestrequireactual를-통해-채워주기](#2-mocking한-typeorm의-내부를-jestrequireactual를-통해-채워주기) 단계에서 `jest.requireActual`를 이용하여 만들어준 `TypeORM`의 `CreateDateColumn`에 대한 호출 결과를 `return`해주면 된다. 최종적인 코드는 아래와 같다.

```ts
jest.mock('typeorm', () => {
  const realTypeORM = jest.requireActual('typeorm');
  return {
    ...realTypeORM,
    CreateDateColumn: (options: ColumnOptions) => {
      options.type = 'datetime';
      return CreateDateColumn(options);
    },
    ...
  };
});
```

<br>

### 테스트 실행하기

위와 같이 준비과정을 하고 `Test.createTestingModule`를 이용하여 `TypeORM`을 포함한 모듈을 생성하고 해당 모듈에서 `DataSource`를 얻어오는 테스트 결과는 아래와 같다.

- Pg타입을 이용한 `Users` Entity.

  ```ts
  @Entity({ name: "users" })
  export class Users {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @CreateDateColumn({ type: "timestamptz", nullable: false })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamptz", nullable: false })
    lastModifiedAt: Date;
  }
  ```

- 테스트 결과

  <img src = "https://user-images.githubusercontent.com/74294325/180629891-2ecc62e2-40cc-475e-8675-80ce405cce23.png">

<br>

## 정리

현재 글은 `CreateDateColumn`를 기준으로 작성을 하였지만 아래와 같은 helper 메소드를 작성하여 각각의 Pg타입과 sqlite의 타입을 mapping시켜줄 수 있다.

```ts
jest.mock('typeorm', () => {
  const realTypeORM = jest.requireActual('typeorm');
  return {
    ...realTypeORM,
    CreateDateColumn: (options: ColumnOptions) => {
      if (options.type) {
        options.type = setAppropriateColumnType(options.type);
      }
      return realTypeORM.CreateDateColumn(options);
    },
    ...
  };
});

function setAppropriateColumnType(mySqlType: ColumnType): ColumnType {
  const postgresSqliteTypeMapping: { [key: string]: ColumnType } = {
    timestamptz: 'datetime',
    timestamp: 'datetime',
    json: 'simple-json',
    enum: 'text',
    bytea: 'text',
  };

  if (Object.keys(postgresSqliteTypeMapping).includes(mySqlType.toString())) {
    return postgresSqliteTypeMapping[mySqlType.toString()];
  }
  return mySqlType;
}
```

Entity를 정의할 때 사용하는 `Column`, `CreateDateColumn`, `UpdateDateColumn`, `DeleteDateColumn`와 같은 데코레이터를 이용할 현재 글의 방법대로 **타입의 불일치를 해결할 수 있다.**

마지막으로 Pg와 sqlite에 대한 글이였지만 다른 DB또한 위와 같은 방법으로 동일하게 적용이 가능할 것이다.

<br>

## REFERENCES

- https://jestjs.io/docs/jest-object

- https://tech.inflab.com/202207-refactoring-legacy-code/

- https://github.com/mikhail-angelov/nestjs-db-unit
