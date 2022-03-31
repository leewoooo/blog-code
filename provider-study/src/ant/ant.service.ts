import { Injectable } from '@nestjs/common';
import { AntService } from './ant-service.interface';

@Injectable()
export class AntServiceImpl implements AntService{
  work(): void {
    console.log('working hardly');
  }
}
