import { Controller, Get } from "@nestjs/common";

// @Controller({
//   version: '2',
//   path: 'users'
// })
// @Controller()
@Controller('users')
export class UsersV2Controller {
  @Get()
  getUsers(): string {
    return 'v2 getUsers Controller'
  }
}