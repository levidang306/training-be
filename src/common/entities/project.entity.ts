import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DateTimeEntity } from './base/dateTimeEntity';
import { ProjectMembers } from './project-members.entity';
import { Board } from './board.entity';

@Entity('projects')
export class Project extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 255 })
  public title: string;

  @Column({ type: 'varchar', nullable: true })
  public description: string;

  @OneToMany(() => ProjectMembers, (projectMember) => projectMember.user)
  public projectMembers: ProjectMembers[];

  @OneToMany(() => Board, (board) => board.project)
  boards: Board[];
}
