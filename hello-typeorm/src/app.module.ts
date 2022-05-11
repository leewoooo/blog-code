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
      username: 'root',
      password: 'passowrd',
      database: 'blog',
      synchronize: true,
      entities: [Users],
      namingStrategy: new SnakeNamingStrategy(),
    }),
    UsersModules,
  ],
})
export class AppModule {}
