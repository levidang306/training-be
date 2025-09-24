import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';
import { List } from './list.entity';
import { Project } from './project.entity';

@Entity('boards')
export class Board extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 255 })
  public title: string;

  @Column({ type: 'text', nullable: true })
  public description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public coverUrl: string;

  @ManyToOne(() => Project, (project) => project.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  public project: Project;

  @OneToMany(() => List, (list) => list.board)
  lists: List[];
}
