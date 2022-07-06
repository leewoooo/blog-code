# TypeORM을 이용한 Migration

## Goal

- TypeORM의 Migration 기능을 사용해보자.

<br>

## Intro

이전 [Database Migration에 관하여...(with go)](https://velog.io/@dev_leewoooo/Database-Migration%EC%97%90-%EA%B4%80%ED%95%98%EC%97%AC...with-go)라는 주제로 마이그레이션에 대해 다룬적이 있다.

현재는 `Go`를 사용하지 않고 `typescript`기반의 `Nest`를 사용하고 있으며 ORM으로는 `TypeORM`을 사용하고 있다. 그렇기 때문에 `TypeORM`에서 제공하는 Migration기능을 사용해보고자 글을 정리한다.

<br>

## Migration이란?

마이그레이션이란 간단히 말해 데이터베이스의 이력을 관리이다. 소스코드를 형상관리(`git`)를 이용해 관리하는 것과 같이 데이테베이스 또한 Migration을 통하여 관리한다. 보통 변경할 사항에 대하여 변경되는 query와 해당 변경사항을 되돌릴 수 있는 query를 작성을 하게 된다.

`TypeORM`에 `synchronize`라는 옵션이 존재하지만 변경사항 이전에 저장되어 있던 데이터에 문제가 생길 수 있기 때문에(sync를 맞추는 과정에서 기존 데이터가 전부 삭제되고 제로 베이스에서 시작하는 일이 발생함.) **`production` 레벨의 애플리케이션에서는 해당 옵션을 `false`로 두고 Migration 전략을 가져가게 된다.**

<br>

## TypeORM에서 마이그레이션 시작하기

마이그레이션을 할 때 작업 순서는 아래와 같다.

1. ormconfig.ts 파일 작성하기.

2. package.json에서 script 작성하기.

3. 마이그레이션 파일 생성 및 query 문 작성하기.

4. 실행시키기.

## ormconfig.ts 파일 작성하기.

`TypeORM`의 Connection 정보를 정의하는 `ormconfig.ts`를 작성한다.

```ts
export const typeOrmModuleOptions: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT5432,
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: false,
  ...
};

export const OrmConfig = {
  ...typeOrmModuleOptions,
  migrationsTableName: "migrations",
  migrations: ["migrations/*.ts"],
  cli: {
    migrationsDir: "migrations",
  },
};
export default OrmConfig;
```

위에서 보면 `typeOrmModuleOptions`와 `typeOrmModuleOptions`를 이용한 `OrmConfig`를 정의하였다. `OrmConfig`를 `default export`로 내보낸 이유는 이 후에도 설명을 하겠지만 Migration 옵션 중 `-c`(커넥션) 옵션을 부여하게 되는데 **`named export`를 이용하여 내보내게 되면 `TypeORM` 라이브러리에서 어떠한 것을 사용해야 할 지 몰라 `cli`의 옵션이 적용되지 않는다.**

그렇기 때문에 하나의 파일에서 한번만 사용할 수 있는 `export default`를 이용하여 `OrmConfig`를 내보내 준다.

<br>

## package.json에서 script 작성하기.

`yarn` 명령와 같이 편하게 사용하기 위해 `package.json`의 `script`에 아래와 같이 작성을 한다.

```ts
"scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    ...
    "typeorm": "node -r tsconfig-paths/register -r ts-node/register ./node_modules/typeorm/cli.js --config src/ormconfig.ts"
  },

```

`script`에서 `tsconfig-paths/register`를 추가한 이유는 `tsconfig.json`파일에서 정의한 **타입 alias경로**를 읽지 못하기 때문이다. 그렇기 때문에 `tsconfig-paths/register`를 이용하여 **절대경로로 변경 후 사용하기 위함이다.**

`ts-node/register`는 `typescript`파일인 `ormconfig.ts`를 바로 읽지 못하고 트랜스파일 과정을 거쳐야 한다. 그렇기 때문에 `ts-node`를 이용하여 `node`가 `ts`파일을 읽을 수 있도록 하기 위함이다. (`ts-node`를 이용한다고 해서 트랜스파일 과정을 안거치는 것은 아니며 **변환되는 `js`파일을 임시 폴더안에 두고 실행을 하는 것이다.**)

`--config src/ormconfig.ts` 옵션은 커넥션 정보를 담고 있는 `Object`를 내보내는 `ts`파일의 위치를 정의하면 된다. 위에서 설명한 것과 같이 `export default`를 이용하여 내보낸 `OrmConfig`가 이 때 읽힌다.

위와 같은 설정을 하고 명령어 창에 `yarn typeorm`을 입력하면 도움말을 확인할 수 있으며 마이그레이션 관련해서 자주 사용하는 도움말들만 가져오면 아래와 같다.

```zsh
  migration:create    Creates a new migration file.
  migration:generate  Generates a new migration file with sql needs to be executed to update schema.
  migration:run       Runs all pending migrations.
  migration:revert    Reverts last executed migration.
```

<br>

## 마이그레이션 파일 생성 및 query 문 작성하기.

`TypeORM`을 이용하여 마이그레이션을 진행할 때 `migration:create` 혹은 `migration:generate`를 이용할 수 있다.

`migration:generate`와 같은 경우에는 [Migration generation drops and creates columns instead of altering resulting in data loss](https://github.com/typeorm/typeorm/issues/3357)와 같은 이슈가 있다. 간단하게 정리하면 **컬럼이 변경되면 해당 테이블의 컬럼을 DROP하고 재 생성하는 방식으로 이뤄진다.** (`migration:generate`는 엔티티를 변경하고 실행하면 변경된 점에 대해 자동으로 마이그레이션 파일을 생성해준다.)

그렇기 때문에 현재 글은 `migration:create`를 기준으로 작성하겠다. `migration:create`와 같이 생성할 파일의 명을 입력하면 `TypeORM Cli`가 마이그레이션 파일을 생성해준다.

```ts
//명령어
yarn typeorm migration:create add_text_column

//생성된 파일의 code
export class addTextColumn1657093035722 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //변경사항 query
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //변경사항을 되돌릴 query
  }
}
```

마이그레이션 파일을 생성하는 명령어를 입력하면 이전 `OrmConfig.ts`에서 정의한 `migrationsDir`안으로 들어가게 된다. 생성된 파일의 메소드에서 `up`에는 **변경사항 query를 작성하고** `down`에는 **변경사항을 되돌릴 query를 작성한다.**

<br>

## 실행시키기.

이제 마이그레이션을 실행시키는 일만 남았다. 마이그레이션 실행은 `migration:run`와 `migration:revert`명령어를 통해 진행되며 직관적으로 `run`은 `up`을 실행 시키는 것이고 `revert`는 `down`을 실행시키는 것이다.

`migration:run` or `migration:revert`를 실행시킬 때는 이전 `package.json`에서 정의한 `--config`인 `OrmConfig.ts`의 **연결 정보를 가지고 진행을 하게 된다.**

**기본적으로 마이그레이션을 진행할 때 `TRANSACTION`안에서 진행되며 만약 진행을 하다 오류가 발생하면 `ROLLBACK`이 진행된다.**

`migrationsDir`에 정의한 마이그레이션 파일이 여러개인 경우 `migration:run`을 하면 `timestamp`를 기준으로 제일 늦게 생성된 마이그레이션 파일까지 적용되게 된다. **하지만** `migration:revert`와 같은 경우 **한 단계씩 내려간다.**

처음 마이그레이션을 하는 경우 데이터베이스에 `migrations`라는 테이블이 생기며 이력들이 저장된다. (설정에서 `migrationsTableName`로 커스텀이 가능하다.)

- 생성 된 테이블 구조

  | id  | timestamp     | name                       |
  | :-- | :------------ | :------------------------- |
  | 1   | 1657093035722 | addTextColumn1657093035722 |

<br>

## 정리

`TypeORM`을 사용하고 있어서 `built-in`되어 있는 마이그레이션을 이용하였지만 이전에 사용해 봤던 [golang-migrate](https://github.com/golang-migrate/migrate)가 ~~더 편한 것 같기도...~~

<br>

## REFERENCE

- https://orkhan.gitbook.io/typeorm/docs/migrations

- https://velog.io/@dev_leewoooo/Database-Migration%EC%97%90-%EA%B4%80%ED%95%98%EC%97%AC...with-go

- https://github.com/typeorm/typeorm/issues/3357

- https://velog.io/@heumheum2/typeORM-Migration-%EC%9D%B4%EC%8A%88
