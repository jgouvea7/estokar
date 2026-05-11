import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');

    if (!email || !password) {
      return;
    }

    const existing = await this.usersRepository.findOne({
      where: { email },
      select: ['id'],
    });

    if (existing) {
      return;
    }

    const now = new Date();
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = this.usersRepository.create({
      name: 'Admin',
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      createdAt: now,
      updatedAt: now,
    });

    await this.usersRepository.save(admin);
    this.logger.log('Admin seed criado com sucesso.');
  }
}
