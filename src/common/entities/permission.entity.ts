import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;
  @Column({ type: 'varchar', unique: true, length: 100 })
  public name: string;
  @Column({ type: 'text', nullable: true })
  public description: string;
  @ManyToMany(() => Role, (role) => role.permissions)
  public roles: Role[];
}
