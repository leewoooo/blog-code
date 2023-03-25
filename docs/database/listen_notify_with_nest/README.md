# Postgresql Listen & Notify

## Goal

- pg에서 비동기식 처리는 어떻게 하는지에 대한 이해
- Listen & Notify의 사용방법

<br>

## 데이터베이스의 비동기식 처리

만약 데이터베이스에 새 자료가 등록된 것을 확인하고 싶다면 어떻게 해야할까?

1. 주기적으로 해당 테이블의 마지막 자료를 확인한다. 조회를 하였을 때 현재의 데이터와 마지막 자료가 다르다면 새로운 자료가 등록되었다고 판단한다.

2. 테이블에 트리거를 등록하여 새 자료가 등록되면 해당 데이터를 타 테이블에 저장하고 해당 테이블을 1번 방식처럼 주기적으로 확인한다.

위와 같은 방법을 이용하면 **데이터 베이스 자원을 필요 이상으로 사용하게 된다.** 테이블에 과도한 접근이 일어나며 특정 이벤트를 검사하는 주기를 짧게 잡기도 어렵다.

그래서 이러한 작업의 처리는 대게 응용 프로그램의 도움을 받는다. 물론 서버가 이런 비동기식 작업들에 대한 다양한 기능을 제공한다면 보다 쉽게 구현할 수 있다.

Postgresql에서는 대표적으로 Listen & Notify를 제공한다.

위의 내용 까지가 Postgresql에서 공식적으로 제공하는 데이터 베이스 비동기식 처리이다.

**하지만** 내가 원하는 건 하나의 테이블에 데이터가 저장 되면 저장 이벤트를 듣고 있던 listener가 저장 된 데이터를 가지고 후 처리를 하고 싶은 것이다. (그래서 아마 트리거 + 트리거 함수 + Listen & Notify의 조합이 될 것 같다.)

<br>

## Listen & Notify

Postgresql에서 Listen & Notify를 이용하면 한 쪽에서는 어떤 채널에 어떤 내용을 공지하고(Notify), 반대 쪽에서는 채널을 듣고(Listen)있다가 작업을 할 수 있다.

Postgresql 공식 문서에서 해당 기능을 통해 구현이 가능한 예시들을 설명해주고 있는데 내가 Listen & Notify를 이용하여 궁극적으로 구현하고자 하는 내용이 적혀있어서 기뻤다.

![image](https://user-images.githubusercontent.com/74294325/223598215-472d5659-9ea5-4de1-9218-17d7349dcd0d.png)

<br>

### Notify

응용 프로그램에서 Notify는 Listen 보다 구현하는 부분이 간단하다.

```sql
NOTIFY 채널이름, '내용'
```

위와 같은 쿼리만 Postgresql 서버로 보내면 된다. 여기서 문제는 채널 이름의 규칙과, 내용의 구칙 설계를 Listen을 하는 쪽과 잘 맞춰야 한다.

<br>

### Listen

Listen 쪽에서는 아래와 같은 Query를 이용하여 특정 채널에 대한 내용을 얻어올 수 있다.

```sql
LISTEN 채널이름
```

Listen을 하기 위해서는 **감시 작업(polling)**을 해야한다. 대부분의 Postgresql 클라이언트 라이브러리들은 해당 기능을 APi로 제공해주고 있다.

<br>

## 주의

- Listen & Notify 작업은 `connection.poll()`같은 **각 언어 별 클라이언트 라이브러리에서 제공하는 API를 이용하여 작업 비용을 효율화** 할 수 있다.

- Listen 하나도 없는 Notify는 **버려진다.**

<br>

## Usage

위에서 전반적인 내용을 알아봤으니 사용법을 하나씩 알아보기를 원한다. Listen & Notify를 하기 위해 필요한 요소는 아래와 같다.

> 채널을 통해 Listen & Notify 예제가 아닌 테이블에 데이터가 Insert 되면 해당 데이터를 Listen & Notify를 이용하여 Client에게 전달하는 예제이다.

1. 이벤트 주체 테이블

2. 테이블에 데이터가 Insert 되었을 때 Notify를 할 trigger function

3. trigger

4. Notify를 듣고있는 Listener (Client)

<br>

## Table (이벤트 주체 테이블)

이벤트 주체 테이블은 크게 특이점이 없다. 사실 모든 테이블이 이벤트 주체 테이블이 될 수 있다.

예제에서는 간단하게 테이블 아래와 같이 테이블을 구성하겠다.

```sql
CREATE SEQUENCE IF NOT EXISTS tmp_notify_id_seq;

CREATE TABLE IF NOT EXISTS tmp_notify (
    id          BIGINT          NOT NULL        DEFAULT nextval('tmp_notify_id_seq') PRIMARY KEY,
    content     TEXT            NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL        DEFAULT now()
);
```

<br>

## trigger function (테이블에 데이터가 Insert 되었을 때 Notify를 할 함수)

PL/pgSQL은 데이터 변경 또는 DB 이벤트에 대한 트리거 기능을 정의하는데 사용할 수 있다.

트리거 함수는 `CREATE FUNCTION`의 파라미터를 없이 선언하고 RETURN에 `trigger` 또는 `event_trigger`를 선언으로 생성할 수 있다.

```sql
CREATE OR REPLACE FUNCTION fn_notify_trigger() RETURNS trigger AS $$ -- 1
BEGIN -- 2
	PERFORM pg_notify('tmp_notify',row_to_json(NEW)::text); -- 3
	RETURN NULL;
END; -- 4
$$
LANGUAGE plpgsql;
```

1. trigger function를 정의를 시작하는 선언문이다. trigger function의 이름을 `fn_notify_trigger`로 지정하고 있다.

2. 함수의 시작을 명시한다.

3. `PERFORM` 명령어를 이용하여 결과가 없는 함수를 실행시키며 `pg_notify` 함수를 이용하여 새로 Insert 된 데이터를 Notify한다. `tmp_notify`라는 채널명에 payload를 `row_to_json`함수를 이용하여 보낸다. 이 때 Notify의 payload는 문자열로 보내야 하기 때문에 `::text`로 캐스팅해서 보내준다.

   > payload <br>알림과 함께 전달할 " 페이로드 " 문자열 입니다. 단순 문자열 리터럴로 지정해야 합니다. 기본 구성에서는 8000바이트보다 짧아야 합니다. (바이너리 데이터나 많은 양의 정보를 전달해야 한다면 데이터베이스 테이블에 넣고 레코드의 키를 보내는 것이 가장 좋습니다.)<br>https://www.postgresql.org/docs/current/sql-notify.html

   > 여기서 NEW는 대상 테이블의 Operation에 따라 다른 값이 들어온다. Insert의 경우 새로 생성된 Row의 데이터가 들어오게 된다.

4. 함수의 종료를 명시한다.

<br>

## trigger (테이블에 Insert 될 때 자동으로 동작할 작업)

trigger 함수를 만들었으니 테이블에서 Insert 될 때 자동으로 동작할 작업을 정의한다. 특정 테이블의 Event가 있을 때 DB에서는 `trigger`라고 부르며 위에서 정의한 trigger function을 이용하게 된다.

```sql
CREATE TRIGGER tmp_notify_trigger AFTER INSERT ON tmp_notify -- 1
FOR EACH ROW -- 2
EXECUTE FUNCTION fn_notify_trigger(); -- 3
```

1. trigger를 `tmp_notify_trigger`라는 이름으로 생성하며 `tmp_notify` 테이블의 Insert 이 후 트리거가 될 거라는 것을 명시한다.

2. trigger 이벤트를 해당 테이블의 모든 행에 대해 실행 시킨다는 것을 명시한다.

3. trigger가 실행 되면 위에서 정의한 `fn_notify_trigger`를 실행시킨다는 것을 명시한다.

<br>

## Listener (Client)

Notify 부분은 준비가 완료 되었으니 Listen 쪽을 정의하고자 한다. 간단하게 `NestJs`를 이용하여 예제를 만들 것이며 `TypeOrm`으로 DB의 `Connection`을 맺을 것이다. (`pg`를 이용하여 Connection을 맺고 진행해도 된다.)

<br>

### TypeOrm을 이용하여 Connection 맺기

해당 부분은 `NestJs`공식 문서에 잘 설명이 되어있기 때문에 코드로만 첨부하겠다. - [TypeOrm Integration](https://docs.nestjs.com/techniques/database#typeorm-integration) 예제에서 DB Driver 라이브러리만 `pg`로 변경하면 된다.

```ts
// app.module.ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "postgres",
      password: "password",
      database: "listen_notify",
    }),
  ],
})
export class AppModule {}
```

<br>

### Connection에서 Pg Client 얻기

`TypeOrm`을 이용하여 Root에서 `Connection`을 맺으면 하위 Provider에서는 `dataSource`를 `DI`받을 수 있다.

`dataSource`에서 `QueryRunner`를 생성 후 `connect()` API를 호출하면 현재 `Connection`을 맺은 DB의 Client를 얻어올 수 있다. 즉 현재 Postgresql을 이용하고 있기 때문에 `connect()`를 호출 하면 `Postgresql`의 Client를 얻어올 수 있다.

`connect()`를 호출 하면 `connection pool`에서 `Connection`을 생성하여 Return해준다.

```ts
// QueryRunner
/**
 * Creates/uses database connection from the connection pool to perform further operations.
 * Returns obtained database connection.
 */
connect(): Promise<any>;

// app.module.ts
export class AppModule implements OnModuleInit, OnModuleDestroy {
  private readonly queryRunner: QueryRunner;

  constructor(private readonly dataSource: DataSource) {
    this.queryRunner = dataSource.createQueryRunner();
  }

  async onModuleInit() {
    const client = (await this.queryRunner.connect()) as Client;
    //...
  }
}
```

<br>

### Client를 이용하여 Listen 하기

`pg` Client를 이용하여 Notify에서 정의한 `tmp_notify` 채널을 구독할 것이다. 또한 구독을 시작하였으니 채널에서 넘어오는 payload를 사용할 수 있다.

```ts
const client = (await this.queryRunner.connect()) as Client;

await client.query("LISTEN tmp_notify");  // 1
client.on("notification", (data: any) => { // 2
  // do something
});
```

1. Notify하는 채널에 대한 구독을 시작합니다.
2. Notify가 되었을 때 실행 될 CallBack을 정의할 수 있다.

<br>

### 결과

`tmp_notify`테이블에 데이터가 Insert 되면 trigger가 동작하여 Notify를 하게 되며 Notify를 한 후 `NestJs`에서 정의한 Listener가 해당 데이터를 가져다가 사용하게 된다.

```bash
# Notify
insert into tmp_notify (f_input_date, "data") values ('20230311', 'Notify & Listen Example'::text);

# Listen
NotificationResponseMessage {
  length: 128,
  processId: 9556,
  channel: 'tmp_notify',
  payload: '{
        "f_input_date":"20230311",
        "data":"Notify & Listen Example",
        "created_at":"2023-03-11T15:55:18.423159+09:00"
        }',
  name: 'notification'
}
```

<br>

## 정리

![notify_listen](https://user-images.githubusercontent.com/74294325/223642314-69b830c9-8888-420a-b4d3-bd10f96cf27b.png)

정리하자면 위와 같은 구조를 갖게 된다. 어떠한 요청에 의해 서버에서 **Postgresql에 Data를 Insert하였을 때** Postgresql는 해당 데이터를 **특정 채널에 Notify** 하고 그 **채널을 Listen하는 Listener들이 Notify 된 데이터를 가져다가 사용**하게 되는 구조로 정리할 수 있을 것 같다. (**Insert에 한정 된 이야기가 아니다.**)

<br>

## Reference

- https://postgresql.kr/blog/pg_listen_notify.html

- http://postgresql.kr/docs/current/sql-listen.html

- http://postgresql.kr/docs/current/sql-notify.html

- https://www.postgresql.kr/docs/current/plpgsql-trigger.html

- https://m-falcon.tistory.com/528
