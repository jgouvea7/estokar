import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { makeUser } from '../common/test/factories';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Record<string, jest.Mock>;

  const mockUser = makeUser();

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      getProfile: jest.fn(),
      googleLogin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mobile://,exp://,http://localhost'),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with the dto', async () => {
      const dto: RegisterDto = {
        name: 'User',
        email: 'a@b.com',
        password: '12345678',
      };
      authService.register.mockResolvedValue(mockUser);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should call authService.login with the dto', async () => {
      const dto: LoginDto = { email: 'a@b.com', password: '123456' };
      const tokens = {
        accessToken: 'at',
        refreshToken: 'rt',
        user: { id: '1' },
      };
      authService.login.mockResolvedValue(tokens);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });
  });

  describe('refreshTokens', () => {
    it('should call authService.refreshTokens', async () => {
      authService.refreshTokens.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      const result = await controller.refreshTokens('user-1', 'refresh-token');

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'user-1',
        'refresh-token',
      );
      expect(result).toEqual({ accessToken: 'at', refreshToken: 'rt' });
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      await controller.logout('user-1');

      expect(authService.logout).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile', async () => {
      authService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile('user-1');

      expect(authService.getProfile).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });
  });
});
