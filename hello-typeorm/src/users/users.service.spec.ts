import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { IBackup, newDb } from 'pg-mem';
import { Connection, QueryRunner, Repository } from 'typeorm';
import { Users } from './domain/users.entity';
import { UsersService } from './users.service';

describe('TypeORM Connection, Repository Test With pg-mem', () => {
  let connection: Connection;
  let repository: Repository<Users>;

  beforeAll(async () => {
    // setting memory database
    const db = newDb();
    db.public.registerFunction({
      name: 'current_database',
      implementation: () => 'test',
    });

    connection = await db.adapters.createTypeormConnection({
      type: 'postgres',
      entities: [Users],
      database: 'test',
      synchronize: true,
    });

    repository = connection.getRepository(Users);
  });

  afterAll(async () => {
    await connection.close();
  });

  it('to be defined', () => {
    expect(connection).toBeDefined();
    expect(repository).toBeDefined();
  });
});

describe('Users Serviec Test with TestModule', () => {
  let backup: IBackup;
  let connection: Connection;
  let userService: UsersService;
  let repository: Repository<Users>;

  beforeAll(async () => {
    // setting memory database
    const db = newDb();
    db.public.registerFunction({
      name: 'current_database',
      implementation: () => 'test',
    });

    connection = await db.adapters.createTypeormConnection({
      type: 'postgres',
      entities: [Users],
    });
    await connection.synchronize();

    //https://github.com/oguimbal/pg-mem/blob/master/readme.md#rollback-to-a-previous-state
    backup = db.backup();
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    const moduelRef = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(), TypeOrmModule.forFeature([Users])],
      providers: [UsersService],
    })
      .overrideProvider(Connection)
      .useValue(connection)
      .compile();

    repository = connection.getRepository(Users);
    userService = moduelRef.get<UsersService>(UsersService);
  });

  afterEach(async () => {
    backup.restore();
  });

  it('to be defined', () => {
    expect(userService).toBeDefined();
  });

  it('save Test', async () => {
    //given
    const newUsers = new Users();
    newUsers.name = 'foobar';

    //when
    const saved = await userService.save(newUsers);

    //then
    expect(saved.id).toBe(1);
    expect(saved.name).toBe('foobar');
    expect(saved.createdAt).not.toBeUndefined();
    expect(saved.lastModifiedAt).not.toBeUndefined();
  });

  it('findAll', async () => {
    //given
    const newUsers = new Users();
    newUsers.name = 'foobar';
    await userService.save(newUsers);

    //when
    const users = await userService.findAll();

    //then
    expect(users.length).toBe(1);
    expect(users[0].id).toBe(1);
    expect(users[0].name).toBe('foobar');
    expect(users[0].createdAt).not.toBeUndefined();
    expect(users[0].lastModifiedAt).not.toBeUndefined();
  });

  it('findById', async () => {
    //given
    const newUsers = new Users();
    newUsers.name = 'foobar';
    const saved = await userService.save(newUsers);

    //when
    const result = await userService.findById(saved.id);

    //then
    expect(result.id).toBe(1);
    expect(result.name).toBe('foobar');
    expect(result.createdAt).not.toBeUndefined();
    expect(result.lastModifiedAt).not.toBeUndefined();
  });
});

describe('Users Serviec Transaction Test with TestModule', () => {
  let backup: IBackup;
  let connection: Connection;
  let userService: UsersService;
  let repository: Repository<Users>;

  beforeAll(async () => {
    // setting memory database
    const db = newDb();
    db.public.registerFunction({
      name: 'current_database',
      implementation: () => 'test',
    });

    connection = await db.adapters.createTypeormConnection({
      type: 'postgres',
      entities: [Users],
      logging: true,
    });
    await connection.synchronize();

    //https://github.com/oguimbal/pg-mem/blob/master/readme.md#rollback-to-a-previous-state
    backup = db.backup();
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    const moduelRef = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(), TypeOrmModule.forFeature([Users])],
      providers: [UsersService],
    })
      .overrideProvider(Connection)
      .useValue(connection)
      .compile();

    repository = connection.getRepository(Users);
    userService = moduelRef.get<UsersService>(UsersService);
  });

  afterEach(async () => {
    backup.restore();
  });

  it('pg-mem 트랜잭션 테스트', async () => {
    //given
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const newUsers = new Users();
    newUsers.name = 'foobar';
    try {
      await queryRunner.manager.save(newUsers);
      throw new InternalServerErrorException();
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    //when
    const queryRunner2 = connection.createQueryRunner();
    await queryRunner.connect();
    const result = await queryRunner2.manager.find(Users);

    //then
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('foobar');
  });

  it('User 저장 with transaction', async () => {
    //given
    const newUsers = new Users();
    newUsers.name = 'foobar';

    //when
    const result = await userService.saveWithQueryRunner(newUsers);

    // then
    expect(result.name).toBe('foobar');
  });

  it('User 저장 with transaction Error', async () => {
    //given
    const newUsers = new Users();
    newUsers.name = 'foobar';

    //when
    //then
    await expect(
      userService.saveWithQueryRunnerWithError(newUsers),
    ).rejects.toThrowError(new InternalServerErrorException());
  });
});

describe('Transaction Unit Test', () => {
  let usersService: UsersService;
  let connection: Connection;

  const qr = {
    manager: {},
  } as QueryRunner;

  class ConnectionMock {
    createQueryRunner(mode?: 'master' | 'slave'): QueryRunner {
      return qr;
    }
  }

  beforeEach(async () => {
    Object.assign(qr.manager, { save: jest.fn() });

    qr.connect = jest.fn();
    qr.release = jest.fn();
    qr.startTransaction = jest.fn();
    qr.commitTransaction = jest.fn();
    qr.rollbackTransaction = jest.fn();
    qr.release = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: Connection,
          useClass: ConnectionMock,
        },
        {
          provide: getRepositoryToken(Users),
          useValue: new Repository(),
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    connection = module.get<Connection>(Connection);
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  it('정상적으로 저장되는 경우', async () => {
    //given
    const now: Date = new Date();
    const willSavedUser: Users = {
      id: 1,
      name: 'foobar',
      createdAt: now,
      lastModifiedAt: now,
    };
    const queryRunner = connection.createQueryRunner();

    jest
      .spyOn(queryRunner.manager, 'save')
      .mockResolvedValueOnce(willSavedUser);

    //when
    const result = await usersService.saveWithQueryRunner(new Users());

    //then
    expect(result).toStrictEqual(willSavedUser);
    expect(queryRunner.manager.save).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('save 도중 Error가 발생하는 경우', async () => {
    //given
    const now: Date = new Date();
    const willSavedUser: Users = {
      id: 1,
      name: 'foobar',
      createdAt: now,
      lastModifiedAt: now,
    };
    const queryRunner = connection.createQueryRunner();

    jest
      .spyOn(queryRunner.manager, 'save')
      .mockRejectedValueOnce(new Error('DataBase Error 발생'));

    const result = await usersService.saveWithQueryRunner(new Users());

    expect(result).toBeUndefined();
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});
