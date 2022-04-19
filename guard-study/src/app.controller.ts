import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Roles } from './roles.decorator';

@Controller()
// 인스턴스 대신 타입을 전달하였으며, 인스턴스화에 대한 책임은 프레임워크에 남겨두고 의존성을 주입가능하게 하였다.
// @UseGuards(new AppGuard())
// @UseGuards(AppGuard)
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  // @SetMetadata('role', 'admin')
  // @UseGuards(RoleGuard)
  @Roles('admin')
  getHello(): string {
    return this.appService.getHello();
  }
}
