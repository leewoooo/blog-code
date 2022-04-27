import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) { }

  async findAll(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  async findById(validator: Prisma.UserFindUniqueArgs): Promise<User> {
    return this.prismaService.user.findUnique(validator)
  }

  async save(validator: Prisma.UserCreateArgs): Promise<User> {
    return this.prismaService.user.create(validator);
  }

  async update(validator: Prisma.UserUpdateArgs): Promise<User> {
    return this.prismaService.user.update(validator);
  }

  // delete의 경우에도 삭제 된 후 삭제된 entity를 뱉는다.
  // 삭제의 경우 query를 보면 한번 존재하는지 확인 후 없으면 error를 터트린다.
  async deleteById(validator: Prisma.UserDeleteArgs): Promise<void> {
    await this.prismaService.user.delete(validator);
  }
}