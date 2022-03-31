import { Controller, Get, Inject } from '@nestjs/common';
import { AntService } from './ant-service.interface';

@Controller('ant')
export class AntController {
  constructor(@Inject('antService') private readonly antService: AntService){}

  @Get()
  excuteWork(){
      this.antService.work();
  }
}
