import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppInterceptor } from './app.interceptor';
import { AppService } from './app.service';

@UseInterceptors(AppInterceptor)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
