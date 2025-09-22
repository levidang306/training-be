import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DateTimeEntity } from './base/dateTimeEntity';
import { User } from './user.entity';

@Entity('notifications')
export class Notification extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: ['info', 'warning', 'error'], default: 'info' })
  type: string;

  @Column({ type: 'json', nullable: true })
  data: any;

  @Column({ name: 'isRead', type: 'boolean', default: false })
  isRead: boolean;

  @ManyToOne(() => User, user => user.notifications)
  user: User;
}
