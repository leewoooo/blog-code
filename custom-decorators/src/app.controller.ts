import { Controller, Get, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { AppGuard } from './app.guard';
import { AppService } from './app.service';
import { User, UserModel } from './model/user.model';
import { AppWithInterfaceGuard } from './app-with-interface.guard';
import { UserData } from './user-data.decorator';
import { UserWithInterface } from './user-with-interface.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @UseGuards(AppGuard)
  getHello(@UserData() user: UserModel) {
    console.log(user);
    return this.appService.getHello();
  }

  @Get('/interface')
  @UseGuards(AppWithInterfaceGuard)
  withInterface(@UserWithInterface() user: User) {
    console.log(user);
  }
}
