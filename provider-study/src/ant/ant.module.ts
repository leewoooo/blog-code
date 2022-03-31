import { ClassProvider, Module } from '@nestjs/common';
import { AntController } from './ant.controller';
import { AntService } from './ant-service.interface';
import { AntServiceImpl } from './ant.service';

const antService: ClassProvider = {
  provide: 'antService',
  useClass: AntServiceImpl
} 

@Module({
  controllers: [AntController],
  providers: [
    antService
  ]
})
export class AntModule {}
