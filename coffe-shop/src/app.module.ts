import { ClassProvider, Module } from '@nestjs/common';
import { BaristaA } from './implement/barista-a';
import { CustomerA } from './implement/customer-a';
import { MenuBard } from './implement/menu-board';

export const customer: ClassProvider = {
  provide: 'customer',
  useClass: CustomerA
}

export const menu: ClassProvider = {
  provide: 'menu',
  useClass: MenuBard
}

export const barista: ClassProvider = {
  provide: 'barista',
  useClass: BaristaA
}

@Module({
  imports: [],
  controllers: [],
  providers: [
    customer,
    menu,
    barista
  ],
})
export class AppModule { }
