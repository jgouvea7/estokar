import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ type: 'uuid' })
  targetUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}
