import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface GoogleUser {
  googleId: string;
  name: string;
  email: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async register(dto: RegisterDto): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const existing = await this.usersRepository.findOneBy({ email: dto.email });
    if (existing) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const now = new Date();

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.usersRepository.save(user);
    const { password: _p, refreshToken: _r, ...safeUser } = saved as any;
    return safeUser;
  }

  async login(dto: LoginDto): Promise<AuthTokens & { user: Partial<User> }> {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
      select: ['id', 'name', 'email', 'password', 'alertDaysBefore'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.password || !user.password.startsWith('$2')) {
      throw new UnauthorizedException('Use login com Google para esta conta.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.name);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        alertDaysBefore: user.alertDaysBefore,
      },
    };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'refreshToken'],
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Acesso negado.');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      throw new ForbiddenException('Refresh token inválido.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.name);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { refreshToken: undefined });
  }

  async googleLogin(googleUser: GoogleUser): Promise<AuthTokens & { user: Partial<User> }> {
    if (!googleUser.email) {
      throw new UnauthorizedException('Não foi possível obter e-mail da conta Google.');
    }

    let user = await this.usersRepository.findOneBy({ email: googleUser.email });

    if (!user) {
      const now = new Date();
      user = this.usersRepository.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        password: await bcrypt.hash(crypto.randomUUID(), 12),
        createdAt: now,
        updatedAt: now,
      });
      user = await this.usersRepository.save(user);
    } else if (!user.googleId) {
      user.googleId = googleUser.googleId;
      user.updatedAt = new Date();
      user = await this.usersRepository.save(user);
    }

    const tokens = await this.generateTokens(user.id, user.email, user.name);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        alertDaysBefore: user.alertDaysBefore,
      },
    };
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['products'],
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  private async generateTokens(
    userId: string,
    email: string,
    name: string,
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email, name };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET', 'fallback-secret-change-in-production'),
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN', '15m')) as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'fallback-refresh-secret-change-in-production'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')) as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, {
      refreshToken: hashedRefreshToken,
      updatedAt: new Date(),
    });
  }
}
