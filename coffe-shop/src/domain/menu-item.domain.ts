class MenuItem {
  private readonly name: string;
  private readonly price: number;

  constructor(name: string, price: number) {
    this.name = name;
    this.price = price;
  }

  cost(): number {
    return this.price;
  }

  getName(): string {
    return this.name;
  }
}