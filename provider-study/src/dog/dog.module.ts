import { Module } from '@nestjs/common';
import { DogService } from './dog.service';

@Module({
  providers: [DogService],
  exports: []
})
export class DogModule {}
