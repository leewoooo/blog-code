import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Users } from './users/domain/users.entity';
import { UsersModules } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'root',
      password: 'password',
      database: 'test',
      synchronize: true,
      entities: [Users],
      namingStrategy: new SnakeNamingStrategy(),
      logging: 'all',
    }),
    UsersModules,
  ],
})
export class AppModule {}
