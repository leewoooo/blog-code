import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) { }

  async findAll(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  async findById(validator: Prisma.UserFindUniqueArgs): Promise<User | null> {
    return this.prismaService.user.findUnique(validator)
  }

  async save(validator: Prisma.UserCreateArgs): Promise<User> {
    return this.prismaService.user.create(validator);
  }

  // update의 경우에도 해당하는 row가 있는지 먼저 검색 후 처리 prisma:query SELECT 1
  // prisma:query BEGIN
  // prisma:query SELECT `main`.`User`.`id` FROM `main`.`User` WHERE `main`.`User`.`id` = ?
  // prisma:query UPDATE `main`.`User` SET `name` = ? WHERE `main`.`User`.`id` IN (?)
  // prisma:query SELECT `main`.`User`.`id`, `main`.`User`.`email`, `main`.`User`.`name` FROM `main`.`User` WHERE `main`.`User`.`id` = ? LIMIT ? OFFSET ?
  // prisma:query COMMIT
  async update(validator: Prisma.UserUpdateArgs): Promise<User> {
    return this.prismaService.user.update(validator);
  }

  // delete의 경우에도 삭제 된 후 삭제된 entity를 뱉는다.
  // 삭제의 경우 query를 보면 한번 존재하는지 확인 후 없으면 error를 터트린다.
  //   prisma:query BEGIN
  // prisma:query SELECT `main`.`User`.`id`, `main`.`User`.`email`, `main`.`User`.`name` FROM `main`.`User` WHERE `main`.`User`.`id` = ? LIMIT ? OFFSET ?
  // prisma:query SELECT `main`.`User`.`id` FROM `main`.`User` WHERE `main`.`User`.`id` = ?
  // prisma:query DELETE FROM `main`.`User` WHERE `main`.`User`.`id` IN (?)
  // prisma:query COMMIT
  async deleteById(validator: Prisma.UserDeleteArgs): Promise<void> {
    await this.prismaService.user.delete(validator);
  }
}