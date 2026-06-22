import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AdminLogAction {
  PROMOTE_USER = 'PROMOTE_USER',
  DELETE_USER = 'DELETE_USER',
}

@Entity()
export class AdminLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AdminLogAction })
  action: AdminLogAction;

  @Column({ type: 'uuid' })
  actorId: string;

  @Column()
  actorName: string;

  @Column({ type: 'uuid' })
  targetUserId: string;

  @Column()
  targetUserName: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
