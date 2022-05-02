import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { User } from '@prisma/client';
import { CreateUsersRequest } from './dto/create-users.dto';
import { UpdateUsersRequest } from './dto/update-users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  async getUsers(): Promise<User[]> {
    return this.usersService.getUsers();
  }

  @Get('/:id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<User | null> {
    return this.usersService.getUserById(id);
  }

  @Post()
  async join(
    @Body() req: CreateUsersRequest
  ): Promise<User> {
    return this.usersService.join(req)
  }

  @Put('/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() req: UpdateUsersRequest
  ) {
    return this.usersService.updateUser(id, req);
  }

  @Delete('/:id')
  async removeUser(
    @Param('id', ParseIntPipe) id: number
  ) {
    await this.usersService.removeUserById(id)
  }
}
