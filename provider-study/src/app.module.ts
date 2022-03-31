import { Module } from '@nestjs/common';
import { CatModule } from './cat/cat.module';
import { DogModule } from './dog/dog.module';
import { AntModule } from './ant/ant.module';

@Module({
  imports: [CatModule, DogModule, AntModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
