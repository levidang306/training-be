import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';
import { Project } from './project.entity';
import { User } from './user.entity';

@Entity('projects')
export class ProjectMembers extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'int' })
  public role: number;

  @ManyToOne(() => User, (user) => user.projectMembers)
  public user: User;

  @ManyToOne(() => Project, (project) => project.projectMembers)
  public project: Project;
}
