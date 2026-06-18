import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { makeUser } from '../common/test/factories';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: Record<string, jest.Mock>;
  let jwtService: Record<string, jest.Mock>;
  let configService: Record<string, jest.Mock>;

  const mockUser = makeUser({ id: 'user-1', email: 'test@example.com' });

  beforeEach(async () => {
    usersRepository = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
    };

    configService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
      get: jest.fn().mockReturnValue('15m'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a user and return safe user without password/refreshToken', async () => {
      const dto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };
      usersRepository.findOneBy.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const result = await service.register(dto);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({
        email: dto.email,
      });
      expect(usersRepository.create).toHaveBeenCalled();
      expect(usersRepository.save).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw ConflictException if email already exists', async () => {
      const dto = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
      };
      usersRepository.findOneBy.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };
    const userWithPassword = {
      ...mockUser,
      password: '$2b$12$hashed',
      alertDaysBefore: 7,
    };

    it('should return tokens and user on successful login', async () => {
      usersRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result).toHaveProperty('refreshToken', 'mock-token');
      expect(result.user).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user has no password (Google account)', async () => {
      const googleUser = { ...userWithPassword, password: null };
      usersRepository.findOne.mockResolvedValue(googleUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Use login com Google para esta conta.',
      );
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      usersRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException on each failed attempt (rate limit removed)', async () => {
      usersRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      for (let i = 0; i < 6; i++) {
        await expect(service.login(loginDto)).rejects.toThrow(
          UnauthorizedException,
        );
      }
    });
  });

  describe('refreshTokens', () => {
    const mockSavedToken = '$2b$12$hashedRefresh';
    const userWithToken = { ...mockUser, refreshToken: mockSavedToken };

    it('should return new tokens on valid refresh', async () => {
      usersRepository.findOne.mockResolvedValue(userWithToken);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.refreshTokens(
        'user-1',
        'valid-refresh-token',
      );

      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result).toHaveProperty('refreshToken', 'mock-token');
    });

    it('should throw ForbiddenException if user not found or no refreshToken', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshTokens('user-1', 'token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if refresh token does not match', async () => {
      usersRepository.findOne.mockResolvedValue(userWithToken);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.refreshTokens('user-1', 'invalid-token'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('should set refreshToken to undefined', async () => {
      await service.logout('user-1');

      expect(usersRepository.update).toHaveBeenCalledWith('user-1', {
        refreshToken: undefined,
      });
    });
  });

  describe('googleLogin', () => {
    const googleUser = {
      googleId: 'google-123',
      name: 'Google User',
      email: 'google@example.com',
      picture: 'https://example.com/pic.jpg',
    };

    it('should create a new user if not exists', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const result = await service.googleLogin(googleUser);

      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(usersRepository.create).toHaveBeenCalled();
      expect(usersRepository.save).toHaveBeenCalled();
    });

    it('should link googleId to existing user without googleId', async () => {
      const existingUser = { ...mockUser, googleId: null };
      usersRepository.findOneBy.mockResolvedValue(existingUser);
      usersRepository.save.mockResolvedValue({
        ...existingUser,
        googleId: 'google-123',
      });

      const result = await service.googleLogin(googleUser);

      expect(result).toHaveProperty('accessToken', 'mock-token');
    });

    it('should throw UnauthorizedException if no email provided', async () => {
      await expect(
        service.googleLogin({ ...googleUser, email: '' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user by id', async () => {
      usersRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockUser);
      expect(usersRepository.findOneBy).toHaveBeenCalledWith({
        id: 'user-1',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
