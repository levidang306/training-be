import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Project } from '@/common/entities/project.entity';
import { Board } from '@/common/entities/board.entity';
import { User } from '@/common/entities/user.entity';
import { ProjectMembers } from '@/common/entities/projectmembers.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Project, Board, ProjectMembers],
  migrationsTableName: 'migrations',
  migrations: [],
  synchronize: false,
});
