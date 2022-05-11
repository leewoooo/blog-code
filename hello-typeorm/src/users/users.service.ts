import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './domain/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users) private readonly repository: Repository<Users>,
  ) {}

  async save(user: Users): Promise<Users> {
    return await this.repository.save(user);
  }

  async findById(id: number): Promise<Users> {
    return await this.repository.findOne(id);
  }

  async findAll(): Promise<Users[]> {
    return await this.repository.find();
  }
}
