import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { makeUser } from '../common/test/factories';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$newhashedpassword'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Record<string, jest.Mock>;
  let categoriesRepository: Record<string, jest.Mock>;
  let productsRepository: Record<string, jest.Mock>;

  const mockUser = makeUser();

  beforeEach(async () => {
    usersRepository = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    categoriesRepository = {
      delete: jest.fn(),
    };

    productsRepository = {
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepository,
        },
        { provide: getRepositoryToken(Product), useValue: productsRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users with products relation', async () => {
      usersRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([mockUser]);
      expect(usersRepository.find).toHaveBeenCalledWith({
        relations: ['products'],
      });
    });

    it('should return empty array when no users', async () => {
      usersRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user with products', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1');

      expect(result).toEqual(mockUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['products'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      usersRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user name successfully', async () => {
      usersRepository.findOneBy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      usersRepository.save.mockResolvedValue({ ...mockUser, name: 'Updated' });

      const result = await service.update(
        'user-1',
        { name: 'Updated' },
        'user-1',
      );

      expect(result.name).toBe('Updated');
    });

    it('should throw ForbiddenException if id does not match requester', async () => {
      await expect(
        service.update('user-1', { name: 'Updated' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-1', { name: 'Updated' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if email already in use', async () => {
      const otherUser = makeUser({ id: 'user-2', email: 'other@example.com' });
      usersRepository.findOneBy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(otherUser);

      await expect(
        service.update('user-1', { email: 'other@example.com' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password if provided', async () => {
      usersRepository.findOneBy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      usersRepository.save.mockResolvedValue(mockUser);

      await service.update('user-1', { password: 'newpassword123' }, 'user-1');

      const [savedUser] = usersRepository.save.mock.calls[0] as [
        { password: string },
      ];
      expect(savedUser.password).toBe('$2b$12$newhashedpassword');
    });
  });

  describe('remove', () => {
    it('should delete user and related data', async () => {
      usersRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.remove('user-1', 'user-1');

      expect(result).toEqual(mockUser);
      expect(productsRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(categoriesRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(usersRepository.delete).toHaveBeenCalledWith({ id: 'user-1' });
    });

    it('should throw ForbiddenException if id does not match requester', async () => {
      await expect(service.remove('user-1', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('user-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
