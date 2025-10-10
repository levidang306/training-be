import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';

import { Board } from '@/common/entities/board.entity';
import { Card } from '@/common/entities/card.entity';
import { CardMembers } from '@/common/entities/card-members.entity';
import { Comment } from '@/common/entities/comment.entity';
import { List } from '@/common/entities/list.entity';
import { Notification } from '@/common/entities/notification.entity';
import { Permission } from '@/common/entities/permission.entity';
import { Project } from '@/common/entities/project.entity';
import { ProjectMembers } from '@/common/entities/project-members.entity';
import { Role } from '@/common/entities/role.entity';
import { User } from '@/common/entities/user.entity';

config();

export default new DataSource({
  type: process.env.DB_TYPE as any,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Project, ProjectMembers, Board, List, Card, CardMembers, Comment, Notification, Role, Permission],
  migrationsTableName: 'migrations',
  migrations: [join(__dirname, '../../src/common/migrations/**/*.ts')],
  synchronize: true,
});
