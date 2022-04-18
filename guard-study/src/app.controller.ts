import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoleGuard } from './role.guard';
import { AppGuard } from './app.guard';
import { AppService } from './app.service';
import { Roles } from './roles.decorator';

@Controller()
// 인스턴스 대신 타입을 전달하였으며, 인스턴스화에 대한 책임은 프레임워크에 남겨두고 의존성을 주입가능하게 하였다.
// @UseGuards(new AppGuard())
// @UseGuards(AppGuard)
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Roles('admin')
  // @UseGuards(RoleGuard)
  getHello(): string {
    return this.appService.getHello();
  }
}
