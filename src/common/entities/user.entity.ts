import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { DateTimeEntity } from './base/dateTimeEntity';
import { ProjectMembers } from './projectmembers.entity';

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

  @OneToMany(() => ProjectMembers, (projectMember) => projectMember.project)
  public projectMembers: ProjectMembers[];
}
