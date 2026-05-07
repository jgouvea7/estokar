import { Product } from '../../products/entities/product.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true, select: false })
  refreshToken: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ type: 'int', default: 7 })
  alertDaysBefore: number;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
