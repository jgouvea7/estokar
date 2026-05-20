import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '@/src/shared/api/products';
import { getStockMovements } from '@/src/shared/api/stock-movements';
import {
  getLocalProducts,
  getOutboxItems,
  markProductSyncError,
  markProductSynced,
  removeOutboxItem,
  replaceLocalProducts,
  replaceLocalStockMovements,
} from '@/src/shared/storage/local-db';
import type { AuthSession, Product } from '@/src/shared/types/domain';
import { isLocalImageUri, uploadProductImageFromUri } from '@/src/shared/utils/images';

export type SyncResult = {
  products: Product[];
  online: boolean;
  pendingCount: number;
};

function sanitizeProductPayload<T extends Record<string, unknown>>(payload: T) {
  const { categoryName: _categoryName, alertDaysBefore: _alertDaysBefore, estimatedDaysLeft: _estimatedDaysLeft, ...rest } = payload;
  return rest;
}

export async function syncProducts(session: AuthSession | null): Promise<SyncResult> {
  if (!session) {
    const products = await getLocalProducts();
    const pendingCount = (await getOutboxItems()).length;
    return { online: false, pendingCount, products };
  }

  try {
    // 1. Process Outbox (Push local changes to backend)
    const outboxItems = await getOutboxItems();

    for (const item of outboxItems) {
      try {
        if (item.operation === 'create_product') {
          let payload = item.payload!;

          if (payload.image && isLocalImageUri(payload.image)) {
            payload = {
              ...payload,
              image: await uploadProductImageFromUri(payload.image, session.user.id),
            };
          }

          const remoteProduct = await createProduct(
            session.accessToken,
            sanitizeProductPayload(payload),
          );
          await markProductSynced(item.localId, remoteProduct);
        } else if (item.operation === 'update_product' && item.remoteId) {
          let payload = item.payload!;

          if (payload.image && isLocalImageUri(payload.image)) {
            payload = {
              ...payload,
              image: await uploadProductImageFromUri(payload.image, session.user.id),
            };
          }

          const remoteProduct = await updateProduct(
            session.accessToken,
            item.remoteId,
            sanitizeProductPayload(payload),
          );
          await markProductSynced(item.localId, remoteProduct);
        } else if (item.operation === 'delete_product' && item.remoteId) {
          await deleteProduct(session.accessToken, item.remoteId);
        }
        await removeOutboxItem(item.id);
      } catch (error) {
        console.error(`Error syncing ${item.operation}:`, error);
        // If it's a 404, the item might be gone from backend, so remove from outbox to stop retrying
        if (error instanceof Error && error.message.includes('404')) {
          await removeOutboxItem(item.id);
        } else {
          await markProductSyncError(item.localId);
        }
      }
    }

    // 2. Fetch Fresh Data (Pull from backend - Source of Truth)
    const [remoteProducts, remoteMovements] = await Promise.all([
      getProducts(session.accessToken),
      getStockMovements(session.accessToken),
    ]);

    // 3. Update Local Storage
    await replaceLocalProducts(remoteProducts);
    await replaceLocalStockMovements(remoteMovements);

    const products = await getLocalProducts();
    const pendingCount = (await getOutboxItems()).length;

    return {
      online: true,
      pendingCount,
      products,
    };
  } catch (error) {
    console.error('Sync failed, falling back to local data:', error);
    const products = await getLocalProducts();
    const pendingCount = (await getOutboxItems()).length;

    return {
      online: false,
      pendingCount,
      products,
    };
  }
}
