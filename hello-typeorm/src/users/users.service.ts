import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, DataSource, Repository } from 'typeorm';
import { Users } from './domain/users.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Users) private readonly repository: Repository<Users>,
  ) {}

  async save(user: Users): Promise<Users> {
    return await this.repository.save(user);
  }

  async saveWithQueryRunner(user: Users): Promise<Users> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const saved = await queryRunner.manager.save(user);
      //...
      await queryRunner.commitTransaction();
      return saved;
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async saveWithQueryRunnerWithError(user: Users): Promise<Users> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(user);
      //...
      throw new InternalServerErrorException();
      // await queryRunner.commitTransaction();
      // return saved;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async saveWithTransactionMethod(user: Users): Promise<void> {
    this.dataSource.transaction<void>(async (em) => {
      await em.save(user);
    });
  }

  async saveWithTransactionMethodWithError(user: Users) {
    this.dataSource.transaction<Users>(async (em) => {
      await em.save(user);
      throw new InternalServerErrorException();
    });
  }

  async findById(id: number): Promise<Users> {
    return await this.repository.findOne({ where: { id: id } });
  }

  async findAll(): Promise<Users[]> {
    return await this.repository.find();
  }
}
