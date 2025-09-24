import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';
import { Card } from './card.entity';
import { User } from './user.entity';

@Entity('card_members')
@Unique(['card', 'user'])
export class CardMembers extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'int' })
  public role: number;

  @ManyToOne(() => Card, (card) => card.cardMembers)
  card: Card;

  @ManyToOne(() => User, (user) => user.cardMembers)
  user: User;
}
