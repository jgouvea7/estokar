import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['userId'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column()
  quantity: number;

  @Column()
  image: string;

  @Column({ default: false })
  hasExpiration: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expirationDate?: Date | null;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
