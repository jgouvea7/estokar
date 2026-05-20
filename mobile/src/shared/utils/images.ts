import { getSupabaseClient } from '../supabase/client';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export function isLocalImageUri(uri: string) {
  return uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('ph:');
}

export function getSupabaseImagePath(imageUrl: string) {
  const marker = '/storage/v1/object/public/product-images/';
  const index = imageUrl.indexOf(marker);
  if (index === -1) return null;
  return imageUrl.slice(index + marker.length);
}

export async function removeSupabaseImage(imageUrl: string) {
  const path = getSupabaseImagePath(imageUrl);
  if (!path) return;
  const supabase = getSupabaseClient();
  await supabase.storage.from('product-images').remove([path]);
}

export async function uploadProductImageFromUri(uri: string, userId: string) {
  const response = await fetch(uri);
  const blob = await response.blob();

  if (blob.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Arquivo muito grande. Limite de 2MB.');
  }

  const extensionMatch = uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch?.[1]?.toLowerCase() ?? 'jpg';
  const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg';
  const fileName = `mobile-${Date.now()}-${Math.round(Math.random() * 10000)}.${safeExtension}`;
  const filePath = `products/${userId}/${fileName}`;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, blob, {
      cacheControl: '3600',
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    });

  if (error || !data) {
    throw new Error(error?.message ?? 'Falha ao enviar imagem.');
  }

  const { data: publicData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);

  if (!publicData?.publicUrl) {
    throw new Error('Nao foi possivel gerar a URL publica.');
  }

  return publicData.publicUrl;
}
