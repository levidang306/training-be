import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';
import { Project } from './project.entity';

@Entity('boards')
export class Board extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 255 })
  public title: string;

  @Column({ type: 'text', nullable: true })
  public description: string;

  @ManyToOne(() => Project, (project) => project.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  public project: Project;
}
