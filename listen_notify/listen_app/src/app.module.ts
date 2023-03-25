import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from 'pg';
import { DataSource, QueryRunner } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'listen_notify',
    }),
  ],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  private readonly queryRunner: QueryRunner;

  constructor(private readonly dataSource: DataSource) {
    this.queryRunner = dataSource.createQueryRunner();
  }

  async onModuleInit() {
    const client = (await this.queryRunner.connect()) as Client;

    await client.query('LISTEN tmp_notify');
    client.on('notification', (data: any) => {
      console.log(data);
    });
  }

  async onModuleDestroy() {
    await this.queryRunner.release();
    await this.dataSource.destroy();
  }
}
