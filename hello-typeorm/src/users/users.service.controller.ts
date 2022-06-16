import { Body, Controller, Get, Post } from '@nestjs/common';
import { Users } from './domain/users.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get()
  greeting() {
    return { message: 'hello world' };
  }

  @Post()
  saveUsers(@Body() req: { name: string }) {
    const newUsers = new Users();
    newUsers.name = req.name;
    return this.usersService.save(newUsers);
  }
}
