import * as SQLite from 'expo-sqlite';

import type {
  AuthSession,
  CreateProductInput,
  Product,
  RemoteProduct,
  StockMovement,
  UpdateProductInput,
} from '@/src/shared/types/domain';

type ProductRow = {
  local_id: string;
  remote_id: string | null;
  name: string;
  description: string;
  category_id: string | null;
  category: string;
  quantity: number;
  low_stock_limit: number;
  image: string;
  sync_status: Product['syncStatus'];
  updated_at: string;
};

export type OutboxItem = {
  id: number;
  operation: 'create_product' | 'update_product' | 'delete_product';
  localId: string;
  remoteId: string | null;
  payload: CreateProductInput | UpdateProductInput | null;
  createdAt: string;
};

const db = SQLite.openDatabaseSync('estokar.db');

export async function initializeLocalDb() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS auth_session (
      id TEXT PRIMARY KEY NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      user_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id TEXT UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category_id TEXT,
      category TEXT NOT NULL DEFAULT 'Geral',
      quantity INTEGER NOT NULL,
      low_stock_limit INTEGER NOT NULL DEFAULT 5,
      image TEXT NOT NULL,
      sync_status TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      local_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await ensureColumn('products', 'category', "TEXT NOT NULL DEFAULT 'Geral'");
  await ensureColumn('products', 'category_id', 'TEXT');
  await ensureColumn('products', 'low_stock_limit', 'INTEGER NOT NULL DEFAULT 5');
}

export async function getSession(): Promise<AuthSession | null> {
  const row = await db.getFirstAsync<{
    accessToken: string;
    refreshToken: string;
    user_json: string;
  }>('SELECT access_token, refresh_token, user_json FROM auth_session WHERE id = ?', ['current']);

  if (!row) {
    return null;
  }

  return {
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    user: JSON.parse(row.user_json),
  };
}

export async function saveSession(session: AuthSession) {
  await db.runAsync(
    `INSERT OR REPLACE INTO auth_session (id, access_token, refresh_token, user_json)
     VALUES (?, ?, ?, ?)`,
    ['current', session.accessToken, session.refreshToken, JSON.stringify(session.user)],
  );
}

export async function clearSession() {
  await db.runAsync('DELETE FROM auth_session WHERE id = ?', ['current']);
}

export async function clearLocalInventoryData() {
  await db.execAsync(`
    DELETE FROM outbox;
    DELETE FROM stock_movements;
    DELETE FROM products;
  `);
}

export async function replaceLocalStockMovements(movements: StockMovement[]) {
  await db.execAsync('DELETE FROM stock_movements');
  for (const movement of movements) {
    await db.runAsync(
      `INSERT INTO stock_movements (id, product_id, product_name, type, quantity, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        movement.id,
        movement.productId,
        movement.productName,
        movement.type,
        movement.quantity,
        movement.createdAt,
      ],
    );
  }
}

export async function getLocalProducts(): Promise<Product[]> {
  const rows = await db.getAllAsync<ProductRow>(
    `SELECT local_id, remote_id, name, description, category_id, category, quantity, low_stock_limit, image, sync_status, updated_at
     FROM products
     ORDER BY updated_at DESC`,
  );

  return rows.map(mapProductRow);
}

export async function createLocalProduct(input: CreateProductInput): Promise<Product> {
  const now = new Date().toISOString();
  const localId = `local-${Date.now()}`;

  await db.runAsync(
    `INSERT INTO products
      (local_id, remote_id, name, description, category_id, category, quantity, low_stock_limit, image, sync_status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      localId,
      null,
      input.name,
      input.description,
      input.categoryId ?? null,
      input.category,
      input.quantity,
      input.lowStockLimit,
      input.image,
      'pending',
      now,
    ],
  );

  if (input.quantity > 0) {
    await addStockMovement(localId, input.name, 'in', input.quantity);
  }

  await db.runAsync(
    `INSERT INTO outbox (operation, local_id, payload_json, created_at)
     VALUES (?, ?, ?, ?)`,
    ['create_product', localId, JSON.stringify(input), now],
  );

  return {
    id: localId,
    remoteId: null,
    ...input,
    syncStatus: 'pending',
    updatedAt: now,
  };
}

export async function updateLocalProduct(
  product: Product,
  input: UpdateProductInput,
): Promise<Product> {
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE products
     SET name = ?, description = ?, category_id = ?, category = ?, quantity = ?, low_stock_limit = ?, image = ?, sync_status = ?, updated_at = ?
     WHERE local_id = ?`,
    [
      input.name,
      input.description,
      input.categoryId ?? null,
      input.category,
      input.quantity,
      input.lowStockLimit,
      input.image,
      'pending',
      now,
      product.id,
    ],
  );

  if (product.remoteId) {
    await db.runAsync(
      `INSERT INTO outbox (operation, local_id, payload_json, created_at)
       VALUES (?, ?, ?, ?)`,
      ['update_product', product.id, JSON.stringify({ remoteId: product.remoteId, ...input }), now],
    );
  } else {
    await db.runAsync(
      `UPDATE outbox
       SET payload_json = ?, created_at = ?
       WHERE local_id = ? AND operation = ?`,
      [JSON.stringify(input), now, product.id, 'create_product'],
    );
  }

  return {
    ...product,
    ...input,
    syncStatus: 'pending',
    updatedAt: now,
  };
}

export async function deleteLocalProduct(product: Product): Promise<void> {
  const now = new Date().toISOString();

  await db.runAsync('DELETE FROM products WHERE local_id = ?', [product.id]);
  await db.runAsync('DELETE FROM outbox WHERE local_id = ?', [product.id]);

  if (product.remoteId) {
    await db.runAsync(
      `INSERT INTO outbox (operation, local_id, payload_json, created_at)
       VALUES (?, ?, ?, ?)`,
      [
        'delete_product',
        product.id,
        JSON.stringify({ remoteId: product.remoteId }),
        now,
      ],
    );
  }
}

export async function replaceLocalProducts(remoteProducts: RemoteProduct[]) {
  const now = new Date().toISOString();

  // Clear non-pending products to avoid duplicates or stale data
  // But wait, if we have pending products, we should keep them?
  // Actually, the user wants online-first.

  await db.runAsync('DELETE FROM products WHERE sync_status = ?', ['synced']);

  for (const product of remoteProducts) {
    await db.runAsync(
      `INSERT INTO products
        (local_id, remote_id, name, description, category_id, category, quantity, low_stock_limit, image, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(remote_id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        category_id = excluded.category_id,
        category = excluded.category,
        quantity = excluded.quantity,
        low_stock_limit = excluded.low_stock_limit,
        image = excluded.image,
        sync_status = excluded.sync_status,
        updated_at = excluded.updated_at`,
      [
        product.id,
        product.id,
        product.name,
        product.description,
        product.categoryId ?? null,
        getRemoteCategoryName(product),
        product.quantity,
        product.lowStockLimit ?? 5,
        product.image,
        'synced',
        product.updatedAt ?? now,
      ],
    );
  }
}

export async function markProductSynced(localId: string, remoteProduct: RemoteProduct) {
  await db.runAsync(
    `UPDATE products
     SET remote_id = ?, name = ?, description = ?, category_id = ?, category = ?, quantity = ?, image = ?, sync_status = ?, updated_at = ?
     WHERE local_id = ?`,
    [
      remoteProduct.id,
      remoteProduct.name,
      remoteProduct.description,
      remoteProduct.categoryId ?? null,
      getRemoteCategoryName(remoteProduct),
      remoteProduct.quantity,
      remoteProduct.image,
      'synced',
      remoteProduct.updatedAt ?? new Date().toISOString(),
      localId,
    ],
  );
}

export async function addStockMovement(
  productId: string,
  productName: string,
  type: StockMovement['type'],
  quantity: number,
): Promise<StockMovement> {
  const movement: StockMovement = {
    id: `movement-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    productId,
    productName,
    type,
    quantity,
    createdAt: new Date().toISOString(),
  };

  await db.runAsync(
    `INSERT INTO stock_movements (id, product_id, product_name, type, quantity, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      movement.id,
      movement.productId,
      movement.productName,
      movement.type,
      movement.quantity,
      movement.createdAt,
    ],
  );

  return movement;
}

export async function moveLocalStock(
  product: Product,
  type: StockMovement['type'],
  quantity: number,
): Promise<Product> {
  if (type === 'out' && quantity > product.quantity) {
    throw new Error('Quantidade insuficiente em estoque.');
  }

  const nextQuantity =
    type === 'in'
      ? product.quantity + quantity
      : product.quantity - quantity;

  const updatedProduct = await updateLocalProduct(product, {
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    category: product.category,
    quantity: nextQuantity,
    lowStockLimit: product.lowStockLimit,
    image: product.image,
  });

  await addStockMovement(product.id, product.name, type, quantity);

  return updatedProduct;
}

export async function getStockMovements(): Promise<StockMovement[]> {
  const rows = await db.getAllAsync<{
    id: string;
    product_id: string;
    product_name: string;
    type: StockMovement['type'];
    quantity: number;
    created_at: string;
  }>(
    `SELECT id, product_id, product_name, type, quantity, created_at
     FROM stock_movements
     ORDER BY created_at DESC
     LIMIT 80`,
  );

  return rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    type: row.type,
    quantity: row.quantity,
    createdAt: row.created_at,
  }));
}

export async function markProductSyncError(localId: string) {
  await db.runAsync('UPDATE products SET sync_status = ? WHERE local_id = ?', ['error', localId]);
}

export async function getOutboxItems(): Promise<OutboxItem[]> {
  const rows = await db.getAllAsync<{
    id: number;
    operation: OutboxItem['operation'];
    local_id: string;
    payload_json: string;
    created_at: string;
  }>(
    `SELECT id, operation, local_id, payload_json, created_at
     FROM outbox
     ORDER BY created_at ASC`,
  );

  return rows.map((row) => ({
    id: row.id,
    operation: row.operation,
    localId: row.local_id,
    remoteId: getRemoteIdFromPayload(row.payload_json),
    payload: row.operation === 'delete_product' ? null : getProductPayload(row.payload_json),
    createdAt: row.created_at,
  }));
}

export async function removeOutboxItem(id: number) {
  await db.runAsync('DELETE FROM outbox WHERE id = ?', [id]);
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.local_id,
    remoteId: row.remote_id,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    category: row.category,
    quantity: row.quantity,
    lowStockLimit: row.low_stock_limit,
    image: row.image,
    syncStatus: row.sync_status,
    updatedAt: row.updated_at,
  };
}

function getRemoteIdFromPayload(payloadJson: string): string | null {
  try {
    const payload = JSON.parse(payloadJson) as { remoteId?: string };
    return payload.remoteId ?? null;
  } catch {
    return null;
  }
}

function getProductPayload(payloadJson: string): CreateProductInput | UpdateProductInput | null {
  const payload = JSON.parse(payloadJson) as {
    remoteId?: string;
    name: string;
    description: string;
    category?: string;
    categoryId?: string | null;
    quantity: number;
    lowStockLimit?: number;
    image: string;
  };
  const { remoteId: _remoteId, ...productPayload } = payload;
  return {
    ...productPayload,
    category: productPayload.category ?? '',
    categoryId: productPayload.categoryId ?? null,
    lowStockLimit: productPayload.lowStockLimit ?? 5,
  };
}

function getRemoteCategoryName(product: RemoteProduct): string {
  if (typeof product.category === 'string') {
    return product.category;
  }

  return product.category?.name ?? product.categoryName ?? '';
}

async function ensureColumn(table: string, column: string, definition: string) {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!rows.some((row) => row.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
