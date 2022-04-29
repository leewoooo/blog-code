import { Controller, Get, Version } from "@nestjs/common";

// @Controller({
//   version: '1',
//   path: 'users'
// })
// @Controller()
@Controller('users')
export class UsersV1Controller {
  // @Version('1')
  @Get()
  getUsers(): string {
    return 'v1 getUsers Controller'
  }
}