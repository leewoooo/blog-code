import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { CreateUsersRequest } from './dto/create-users.dto';
import { UpdateUsersRequest } from './dto/update-users.dto';
import { UsersRepository } from './users.repository';
import { UsersValidator } from './users.validator';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersValidator: UsersValidator
  ) { }

  async join(request: CreateUsersRequest): Promise<User> {
    return this.usersRepository
      .save(this.usersValidator.createUsersValidator(request));
  };

  async getUsers(): Promise<User[]> {
    return this.usersRepository.findAll();
  };

  async getUserById(id: number): Promise<User | null> {
    return this.usersRepository
      .findById(this.usersValidator.getUsersByIdValidator(id));
  };

  async updateUser(id: number, req: UpdateUsersRequest): Promise<User> {
    return this.usersRepository
      .update(this.usersValidator.updateUsersValidator(id, req));
  };

  async removeUserById(id: number): Promise<void> {
    // await을 명시해주지 않으면 void의 경우 로직을 실행하지 않고 핸들러가 종료된다.
    return this.usersRepository
      .deleteById(this.usersValidator.deleteUsersValidator(id))
  };
}
