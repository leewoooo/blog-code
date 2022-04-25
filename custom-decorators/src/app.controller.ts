import { Controller, Get, UseGuards, ValidationPipe } from '@nestjs/common';
import { AppGuard } from './app.guard';
import { AppService } from './app.service';
import { UserModel } from './model/user.model';
import { User } from './user.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @UseGuards(AppGuard)
  getHello(@User(new ValidationPipe({ validateCustomDecorators: true })) user: UserModel): string {
    // getHello(@User() user: User): string {
    console.log(user);
    return this.appService.getHello();
  }
}
