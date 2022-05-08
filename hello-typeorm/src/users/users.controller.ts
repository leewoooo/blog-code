import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './domain/users.entity';

@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(Users) private readonly repository: Repository<Users>,
  ) {}

  @Get()
  getUsers() {
    return this.repository.find();
  }
}
