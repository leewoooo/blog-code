import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      // excute되는 query 및 error가 stdout으로 출력됨.
      log: [
        {
          emit: 'stdout', level: 'query'
        },
        {
          emit: 'stdout', level: 'error'
        }
      ]
    });
  }

  async onModuleDestroy() {
    await this.$connect();
  }
  async onModuleInit() {
    await this.$disconnect()
  }

}
