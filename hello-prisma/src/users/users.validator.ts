//https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety/prisma-validator
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateUsersRequest } from "./dto/create-users.dto";
import { UpdateUsersRequest } from "./dto/update-users.dto";

@Injectable()
export class UsersValidator {

  createUsersValidator(request: CreateUsersRequest) {
    return Prisma.validator<Prisma.UserCreateArgs>()({
      data: {
        email: request.email,
        name: request.name
      }
    })
  }

  getUsersByIdValidator(id: number) {
    return Prisma.validator<Prisma.UserFindUniqueArgs>()({
      where: {
        id: id
      }
    })
  }

  updateUsersValidator(id: number, request: UpdateUsersRequest) {
    return Prisma.validator<Prisma.UserUpdateArgs>()({
      data: {
        name: request.name
      },
      where: {
        id: id
      }
    })
  }

  deleteUsersValidator(id: number) {
    return Prisma.validator<Prisma.UserDeleteArgs>()({
      where: {
        id: id
      }
    })
  }
}