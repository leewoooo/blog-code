# TypeORM column mapping하기 (snakeCase, camelCase)

예제는 [Github](https://github.com/leewoooo/blog-code/tree/main/hello-typeorm)에 있습니다 :)

## Goal

- TypeORM을 사용할 때 애플리케이션 필드명은 CamelCase, Database의 Column명은 SnakeCase로 사용하기.

<br>

## 개발 환경

- database: sqllite

- nestjs

- typeorm

<br>

일반적으로 애플리케이션의 필드는 CamelCase로 사용하고 Database의 Column명은 SnakeCase를 이용한다.

TypeORM에서는 Column명에 아무런 option을 주지 않으면 **애플리케이션의 필드명을 그대로 사용하여 매핑을 하게 된다.**

<br>

## mapping이 정상적이지 않을 때

만약 애플리케이션의 필드명과 Database의 Column명이 일치하지 않고 매핑되지 않는다면 사용할 수 없다.

- users entity

  ```ts
  @Entity({ name: "users" })
  export class Users {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @CreateDateColumn({ nullable: false })
    createdAt: Date;

    @UpdateDateColumn({ nullable: false })
    lastModifiedAt: Date;
  }
  ```

<br>

- database

    <img width="784" alt="image" src="https://user-images.githubusercontent.com/74294325/167281340-90c57471-26bf-4bfc-bb03-837b58c1195b.png">

<br>

위와 같은 상태에서 `TypeORM`을 이용하여 데이터를 조작하게되면 아래와 같은 error를 만날 수 있게 된다. 간단하게 `find` 메소드를 실행한 결과이다.

```bash
[Nest] 7655  - 2022. 05. 08. 오후 1:06:51   ERROR [ExceptionsHandler] SQLITE_ERROR: no such column: Users.createdAt
QueryFailedError: SQLITE_ERROR: no such column: Users.createdAt ...
```

<br>

## 해결

해결방법은 2가지가 존재한다.

1. `@Column()` 데코레이터에 `name` Option을 이용하여 `TypeORM`에게 해당 필드가 어떠한 Column에 매핑되는지 알려주기.

2. `typeorm-naming-strategies`를 이용하여 처리하기.

<br>

### 애플리케이션 필드마다 name 부여하기

1번 방법은 간단하지만 반복적인 작업들이 많이 생긴다. entity마다 `@Column()`에 Option을 부여하여 처리하기 때문이다.

방법은 아래의 코드와 같다.

```ts
@Entity({ name: "users" })
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @CreateDateColumn({ name: "created_at", nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ name: "last_modified_at", nullable: false })
  lastModifiedAt: Date;
}
```

<Br>

테이블이 적고, entity의 필드가 적으면 1번 방법도 사용할 수 있겠지만 실무에서는 **테이블이 적고, entity의 필드가 적을 가능성이 희박하다.** 그렇기 때문에 2번 방법을 선택하는 것을 추천한다.

<br>

### typeorm-naming-strategies 라이브러리 사용하기

2번 방법은 라이브러리 하나만 추가해주면 된다.

```bash
yarn add typeorm-naming-strategies
```

추가한 후 `TypeORM`을 설정하는 곳에서 설정 Option중 `namingStrategy`만 추가해주면 된다. 추가하는 코드는 아래와 같다.

```ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      //...
      namingStrategy: new SnakeNamingStrategy(),
    }),
    UsersModules,
  ],
})
export class AppModule {}
```

<br>

이렇게 되면 원했던 **애플리케이션 필드는 camelCase를 사용할 수 있고 Database의 Column명은 snakeCase를 사용할 수 있다.**

만약 `TypeORM`설정 중 `synchronize`를 `true`로 사용하여 `entity`를 통해 Table을 생성할 때 **Table의 column명이 snakeCase로 생성되는 것 또한 확인할 수 있을 것이다.**

<br>

## Reference

- https://github.com/tonivj5/typeorm-naming-strategies

- https://jojoldu.tistory.com/568
