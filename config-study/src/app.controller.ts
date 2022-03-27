import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    console.log(process.env.NODE_ENV);
    console.log(this.configService.get('DATABASE_HOST'));
    console.log(this.configService.get('DATABASE_PORT'));
    console.log(this.configService.get('DATABASE_USER'));
    console.log(this.configService.get('DATABASE_PASSWORD'));
    return this.appService.getHello();
  }
}
