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
      ],
      errorFormat: 'pretty'
    });

    // https://www.prisma.io/docs/concepts/components/prisma-client/middleware/logging-middleware
    this.$use(async (params, next) => {
      const before = Date.now()
      const result = await next(params)
      const after = Date.now()
      console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
      return result
    })
  }

  async onModuleDestroy() {
    await this.$connect();
  }

  async onModuleInit() {
    await this.$disconnect()
  }

}
