import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { newDb, IMemoryDb, IBackup } from 'pg-mem';
import { Connection, Repository } from 'typeorm';
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
