import { Module } from '@nestjs/common';
import { DogModule } from 'src/dog/dog.module';
import { CatController } from './cat.controller';

@Module({
  imports: [DogModule],
  controllers: [CatController],
  providers: []
})
export class CatModule {}
