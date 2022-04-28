import { ClassProvider, Inject, Injectable } from "@nestjs/common";

@Injectable()
export class CustomerA implements Customer {
  // 손님은 커피를 주문하기 위해 스스로 할 수 없는 일을 고민해보자. 스스로 할 수 없는 일이라면 해당 일에 대한 책임이 있는 객체에게 메세지를 요청해 협력을 하면 된다.
  // 손님은 커피를 주문하기 위해 메뉴를 알아야 하기 때문에 메뉴라는 객체와 협력을 하여 메뉴를 알아온다.
  // 손님은 커피를 받기위해 바리스타에게 커피를 요청하여 제조된 커피를 받는다.
  constructor(
    @Inject('menu') private readonly menu: Menu,
    @Inject('barista') private readonly barista: Barista
  ) { }

  order(menuName: string): void {
    // menu 객체에게 메세지를 보내 메뉴 아이템을 얻어온다.
    const menuItem = this.menu.choose(menuName);

    // barista 객체에게 메세지를 보내 제조된 커피를 얻어온다.
    const coffe = this.barista.makeCoffe(menuItem);

    if (coffe) {
      console.log(`good :)`);
    } else {
      console.log(`not exist menu: ${menuName}`);
    }
  }
}
