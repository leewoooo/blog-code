import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColumnOptions, ColumnType, DataSource } from 'typeorm';
import { Users } from './users.entity';

jest.mock('typeorm', () => {
  const realTypeORM = jest.requireActual('typeorm');
  return {
    ...realTypeORM,
    CreateDateColumn: (options: ColumnOptions) => {
      if (options.type) {
        options.type = setAppropriateColumnType(options.type);
      }
      return realTypeORM.CreateDateColumn(options);
    },
    UpdateDateColumn: (options: ColumnOptions) => {
      if (options.type) {
        options.type = setAppropriateColumnType(options.type);
      }
      return realTypeORM.UpdateDateColumn(options);
    },
  };
});

function setAppropriateColumnType(mySqlType: ColumnType): ColumnType {
  const postgresSqliteTypeMapping: { [key: string]: ColumnType } = {
    timestamptz: 'datetime',
    timestamp: 'datetime',
    json: 'simple-json',
    enum: 'text',
    bytea: 'text',
  };

  if (Object.keys(postgresSqliteTypeMapping).includes(mySqlType.toString())) {
    return postgresSqliteTypeMapping[mySqlType.toString()];
  }
  return mySqlType;
}

describe('Pg TypeORM Test with sqlite', () => {
  let dataSource: DataSource;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Users],
          synchronize: true,
        }),
      ],
    }).compile();

    dataSource = moduleRef.get(DataSource);
  });

  it('should be defined', () => {
    expect(dataSource).toBeDefined();
  });
});
