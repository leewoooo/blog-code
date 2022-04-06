import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe
    }
  ],
})
export class AppModule { }
