import { Controller, Get, HttpException, HttpStatus, UseFilters } from '@nestjs/common';
import { AppService } from './app.service';
import { CustomHttpExceptionFilter } from './custom-exception.filter';
import { CustomHttpException } from './custom.exception';

@Controller()
// @UseFilters(CustomHttpExceptionFilter)
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  // @UseFilters(CustomHttpExceptionFilter)
  getHello(): string {
    // 1
    // throw new HttpException('BadRequest', HttpStatus.BAD_REQUEST);

    // const response: Record<string, any> = {
    //   'status': HttpStatus.BAD_REQUEST,
    //   'errorMessage': 'BadRequest'
    // }

    // 2
    // throw new HttpException(response, HttpStatus.BAD_REQUEST)

    // 3
    throw new CustomHttpException('customException', HttpStatus.BAD_REQUEST);
  }
}
