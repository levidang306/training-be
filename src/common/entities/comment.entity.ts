import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DateTimeEntity } from './base/dateTimeEntity';
import { Card } from './card.entity';
import { User } from './user.entity';

@Entity('comments')
export class Comment extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Card, card => card.comments)
  card: Card;

  @ManyToOne(() => User, user => user.comments)
  user: User;
}
