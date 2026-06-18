import { randomUUID } from 'crypto';
import { StockMovementType } from '../../stock-movements/entities/stock-movement.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import type { User } from '../../users/entities/user.entity';
import type { Product } from '../../products/entities/product.entity';
import type { Category } from '../../categories/entities/category.entity';
import type { StockMovement } from '../../stock-movements/entities/stock-movement.entity';
import type {
  AdminLog,
  AdminLogAction,
} from '../../admin/entities/admin-log.entity';

export function makeUser(overrides?: Partial<User>): User {
  const id = randomUUID();
  const now = new Date();
  return {
    id: `user-${id}`,
    name: 'Test User',
    email: `test${id}@example.com`,
    password: '$2b$12$hashedpassword',
    role: UserRole.FREE,
    refreshToken: null,
    googleId: null,
    alertDaysBefore: 7,
    products: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as User;
}

export function makeProduct(overrides?: Partial<Product>): Product {
  const id = randomUUID();
  const now = new Date();
  return {
    id: `product-${id}`,
    userId: 'user-1',
    name: 'Test Product',
    description: 'A test product',
    quantity: 50,
    image: '',
    categoryId: null,
    category: null,
    user: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Product;
}

export function makeCategory(overrides?: Partial<Category>): Category {
  const id = randomUUID();
  const now = new Date();
  return {
    id: `category-${id}`,
    name: 'Test Category',
    userId: 'user-1',
    user: null,
    products: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Category;
}

export function makeStockMovement(
  overrides?: Partial<StockMovement>,
): StockMovement {
  const id = randomUUID();
  const now = new Date();
  return {
    id: `movement-${id}`,
    productId: 'product-1',
    productName: 'Test Product',
    type: StockMovementType.IN,
    quantity: 10,
    userId: 'user-1',
    context: null,
    product: null,
    user: null,
    createdAt: now,
    ...overrides,
  } as StockMovement;
}

export function makeAdminLog(overrides?: Partial<AdminLog>): AdminLog {
  const id = randomUUID();
  return {
    id: `log-${id}`,
    action: 'PROMOTE_USER' as AdminLogAction,
    actorId: 'admin-1',
    targetUserId: 'user-2',
    createdAt: new Date(),
    ...overrides,
  } as AdminLog;
}

export function mockRepository(): Record<string, jest.Mock> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };
}
