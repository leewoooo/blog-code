Coffe Shop (with [객체지향의 사실과 오해](https://book.naver.com/bookdb/book_detail.nhn?bid=9145968))
===

## Goal

커피를 주문하는 과정을 객체들의 협력관계로 구현

<br>

## 시나리오

커피 제조하기

커피 전문점에는 네 가지(아메리카노, 카푸치노, 카라멜 마끼야또, 에스프레소) 커피를 판매하고 있다.

테이블 위에는 **커피의 이름과 가격이 적혀있는 메뉴판이 있으며**, 손님은 테이블에 앉아 **메뉴판을 확인한 후 커피를 주문한다.**

주문 받은 커피는 **바리스타에 의해 제조되어 손님에게 제공된다.**

<br>

## 도메인 찾기

객제지향의 관점에서 커피숍에서 도메인은 다음과 같다.

- 손님

- 메뉴

- 메뉴판

- 바리스타

- 커피

<br>

## 객체들 간의 관계 찾기

### 손님

손님은 메뉴판에서 주문할 커피를 선택할 수 있어야 한다. 그렇기 때문에 손님은 **어떠한 방법으로든 메뉴판을 알아야 한다.** -> **손님과 메뉴판 사이에 관계가 존재한다.** (연관 관계)

다음으로 손님은 바리스타에게 주문을 해야한다. -> **손님과 바리스타 사이에 관계가 존재한다.**(연관 관계)

<br>

### 메뉴판, 메뉴

메뉴판과 메뉴는 **서로 떨어지지 않고 하나의 단위로 움직인다.** 이런 관점에서 메뉴 항목은 객체가 메뉴판 객체에 포함돼 있다고 할 수 있다. -> **포함 관계**

<br>

### 바리스타, 커피

바리스타는 커피를 제조해야 하기 떄문에 **커피를 알고있어야 한다.** 하지만 메뉴판, 메뉴와 다르게 커피는 바리스타의 일종이 아니기 때문에 **포함 관계라고 할 수 없다.**

<br>

## 협력 찾기

### 손님

커피를 주문하라는 협력의 첫번째 메세지는 **커피를 주문하라**이다.

해당 메세지를 수신하는 객체는 손님이다. 여기서 손님이 스스로 할 수 없기 때문에 다른 객체에게 요청을 보내야 하는 메세지는 아래와 같다.

1. 메뉴 항목은 손님의 일부가 아니라 메뉴판의 일부이기 때문에 **메뉴판 객체에게 메세지를 보내** 메뉴를 얻어온다.

2. 얻어온 메뉴를 이용하여 **바리스타 객체에게 메세지를 보내** 제조된 커피를 받는다.

<br>

### 메뉴판

메뉴판은 메세지를 받아 메뉴판에 존재하는 메뉴의 정보를 응답해준다.

<br>

### 바리스타

바리스타는 메뉴의 정보를 받아 커피를 제조하여 제조된 커피를 응답해준다.

<br>

## 인터페이스 정리하기

인터페이스는 협력에서 각각의 객체가 수신할 수 있는 메세지를 추려내면 **객체의 인터페이스가 된다.**

손님은 **주문하기**, 메뉴판은 **메뉴 항목을 찾아서 응답하기**, 바리스타는 **커피를 제조하여 제조된 커피 응답하기**

위와 같이 인터페이스 정의가 가능하며 각각의 메세지에 필요한 **인자**와 함께 정의하면 된다.

<br>

## 구현하기

위와 같이 인터페이스까지 정리가 되었다면 구현을 시작하면 된다.

**메서드와 속성**을 이용하여 인터페이스를 구현해나가면 된다. 여기서 중요한 점은 **메서드와 속성은 외부로 노출되면 안된다는 것이다.**

외부에서 객체에 접근을 하는 유일한 통로는 **인터페이스에 정의되어 있는 방법뿐이다.** 




