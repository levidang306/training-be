import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';
import { CardMembers } from './card-members.entity';
import { Comment } from './comment.entity';
import { Notification } from './notification.entity';
import { ProjectMembers } from './project-members.entity';

@Entity('users')
export class User extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', unique: true, length: 255 })
  public email: string;

  @Column({ type: 'varchar', length: 255 })
  public password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  public name: string;

  @Column({ type: 'text', nullable: true })
  public bio: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public avatarUrl: string;

  @Column({ type: 'bool', nullable: false, default: false })
  public isActive: boolean;

  @OneToMany(() => ProjectMembers, (projectMember) => projectMember.project)
  public projectMembers: ProjectMembers[];

  @OneToMany(() => CardMembers, (cardMember) => cardMember.user)
  public cardMembers: CardMembers[];

  @OneToMany(() => Comment, (comment) => comment.user)
  public comments: Comment[];

  @OneToMany(() => Notification, (notification) => notification.user)
  public notifications: Notification[];
}
