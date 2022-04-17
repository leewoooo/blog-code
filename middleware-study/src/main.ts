import { NestFactory } from '@nestjs/core';
import { AppMiddleware } from './app.middleware';
import { AppModule } from './app.module';
import { logger } from './functional-app.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use(new AppMiddleware())
  app.use(logger)
  await app.listen(3000);
}
bootstrap();
