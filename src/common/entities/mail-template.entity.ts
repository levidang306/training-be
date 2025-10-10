import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';

@Entity('mail_templates')
export class MailTemplate extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 50 })
  public subject: string;

  @Column({ type: 'text', nullable: false })
  public content: string;

  @Column({ type: 'int', nullable: false })
  public trigger: number;
}
