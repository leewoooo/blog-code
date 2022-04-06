import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClassValidation } from './class-validation.pipe';
import { CreateCatDto } from './dto/create-cat.dto';
import { ParseIntPipe } from './parse-int.pipe';

@Controller('cats')
export class CatsController {

  @Post()
  // @UsePipes(ClassValidation) TODO: class를 type으로 지정해줬는데 그럼 언제 생성되서 언제 사용되게 되는 것일까?
  // async saveCatInfo(@Body(new ClassValidation()) req: CreateCatDto) {
  saveCatInfo(@Body() req: CreateCatDto) {
    //...
  }

  @Get('/:id')
  findById(@Param('id', new ParseIntPipe()) id: number) {
    console.log(id);
    console.log(typeof id);
  }
}
