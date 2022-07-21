# Pg-mem에서 정의되지 않은 함수 직접 구현하기

## GOAL

- Pg-mem에서 Custon Function을 정의하는 법을 알아본다.

- Custom Function을 이용하여 Unit Test를 진행한다.

<br>

## Why?

토이프로젝트를 진행하던 도중 `CARDINARITY` 함수를 사용하는 Query문을 작성하였다. 해당 Query를 Pg-mem을 이용하여 테스트를 하려고 했는데 아래와 같은 Error메세지를 마주하게 되었다.

```ts
//query
SELECT
    SUM(CARDINALITY(worship_attendance)) as "worshipAttendance",
    SUM(CARDINALITY(group_attendance)) as "groupAttendance"
FROM "attendance"
WHERE
    year = '2022'
AND
    month = '7';

//error
QueryFailedError: ERROR: function cardinality(integer[]) does not exist
HINT: 🔨 Please note that pg-mem implements very few native functions.

👉 You can specify the functions you would like to use via "db.public.registerFunction(...)"

🐜 This seems to be an execution error, which means that your request syntax seems okay,
but the resulting statement cannot be executed → Probably not a pg-mem error.
```

Error 메세지를 보면 한 눈에 알 수 있듯 `cardinality(integer[])` 함수를 찾을 수 없다는 메세지를 보여준다. 동시에 힌트를 주고 있는데 `registerFunction(...)`를 이용하여 등록하라는 것이였다.

<br>

## Custom Function 구현하기

[Pg-mem](https://github.com/oguimbal/pg-mem#custom-functions) 공식 문서를 확인해보면 Custom Function을 구현하는 방법을 설명하고 있다.

```ts
db.public.registerFunction({
  name: "say_hello",
  args: [DataType.text], //1
  returns: DataType.text, //2
  implementation: (x) => "hello " + x,
});

//query
select say_hello('world')

//result
hello world
```

위의 코드는 `say_hello`라는 custom 함수가 Query문에 있을 때 Pg-mem 보고 어떻게 해석하라고 정의하는 것이다.

1. args: 함수에 어떠한 타입이 인자로 들어올 것인지 정의한다.

2. 함수가 실행되고 Pg-mem에서 return하게 될 타입을 정의한다.

`cardinality(integer[])`는 **배열을 받는다.**

기존 `args` 타입은 `pg-mem`에서 기본적으로 제공하는 type을 넣어주면 되지만 배열의 경우 조금 다르다. 배열의 경우 해결 할 수 있는 방법은 [pg-mem issue #189](//https://github.com/oguimbal/pg-mem/issues/189)를 확인할 수 있다.

배열의 경우 **타입을 얻어온 후 `asArray()` 메소드를 이용하여 배열타입으로 변경해준다.**

예제 코드의 `const arrayType = this.memDB.public.getType(DataType.integer).asArray();` 부분이 위의 내용에 해당된다.

`cardinality(integer[])`를 Custom Function을 이용해 구현하는 최종적인 코드는 아래와 같다.

```ts
//https://github.com/oguimbal/pg-mem/issues/189
const arrayType = this.memDB.public.getType(DataType.integer).asArray();
this.memDB.public.registerFunction({
  name: "cardinality",
  args: [arrayType],
  returns: DataType.integer,
  implementation: (data: number[]): number => {
    return data.length;
  },
});
```

<br>

## 정리

`pg-mem`에서 제공하지 않는 **함수는 Custom Function을 통해 구현이 가능**하며 이를 구현하기 위해서는 해당 **함수의 역할과 쓰임에 대해 구체적으로 알고 있어야 한다.**

<br>

## References

- https://github.com/oguimbal/pg-mem

- https://pgpedia.info/c/cardinality.html
