class Coffe {
  private readonly name: string;
  private readonly price: number;

  constructor(menuItem: MenuItem) {
    this.name = menuItem.getName();
    this.price = menuItem.cost();
  }
}
