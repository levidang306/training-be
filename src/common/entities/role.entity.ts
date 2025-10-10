import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';
import { Permission } from './permission.entity';
import { User } from './user.entity';

@Entity('roles')
export class Role extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;
  @Column({ type: 'varchar', unique: true, length: 100 })
  public name: string;
  @Column({ type: 'text', nullable: true })
  public description: string;
  @ManyToMany(() => User, (user) => user.role)
  public users: User[];
  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable()
  public permissions: Permission[];
}
