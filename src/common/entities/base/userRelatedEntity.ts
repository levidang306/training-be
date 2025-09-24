import { Column, JoinColumn, ManyToOne } from 'typeorm';

import { User } from '../user.entity';

export class UserRelatedEntity {
  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
