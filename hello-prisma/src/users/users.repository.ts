import { PrismaService } from "src/prisma/prisma.service";

export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) { }
}