import { Controller, Get, Inject, Param } from "@nestjs/common";

@Controller()
class CoffeShop {
  constructor(@Inject('customer') private readonly customer: Customer) { }
  @Get('/:menuName')
  comeClient(@Param('menuName') menuName: string) {
    this.customer.order(menuName)
  }
}