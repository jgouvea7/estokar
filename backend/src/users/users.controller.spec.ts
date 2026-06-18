import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { makeUser } from '../common/test/factories';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Record<string, jest.Mock>;

  const mockUser = makeUser();

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findMe', () => {
    it('should return the authenticated user', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findMe('user-1');

      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return user when id matches requester', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-1', 'user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw ForbiddenException when id does not match requester', () => {
      expect(() => controller.findOne('user-1', 'other-user')).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should call usersService.update', async () => {
      const dto = { name: 'Updated' };
      usersService.update.mockResolvedValue({ ...mockUser, name: 'Updated' });

      const result = await controller.update('user-1', dto, 'user-1');

      expect(usersService.update).toHaveBeenCalledWith('user-1', dto, 'user-1');
      expect(result.name).toBe('Updated');
    });
  });

  describe('removeCurrentUser', () => {
    it('should remove the authenticated user', async () => {
      usersService.remove.mockResolvedValue(mockUser);

      const result = await controller.removeCurrentUser('user-1');

      expect(usersService.remove).toHaveBeenCalledWith('user-1', 'user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('should call usersService.remove', async () => {
      usersService.remove.mockResolvedValue(mockUser);

      const result = await controller.remove('user-1', 'user-1');

      expect(usersService.remove).toHaveBeenCalledWith('user-1', 'user-1');
      expect(result).toEqual(mockUser);
    });
  });
});
