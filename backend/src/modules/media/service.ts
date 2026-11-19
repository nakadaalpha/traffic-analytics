/**
 * Cloudflare R2 Media Ingestion & Mirroring Service
 * Menyimpan gambar thumbnail media sosial secara permanen ke Object Storage R2
 * untuk eliminasi ketergantungan pada URL kedaluwarsa (&oe=...) Meta Graph API.
 */

export interface MirrorMediaEnv {
  MEDIA_BUCKET?: R2Bucket;
}

/**
 * Mengunduh gambar thumbnail dari URL eksternal (Instagram/YouTube/TikTok)
 * dan menyimpannya secara permanen ke Cloudflare R2 bucket.
 * Mengembalikan path lokal yang kekal: `/api/media/thumbnails/{key}`.
 */
export async function mirrorThumbnailToR2(
  env: MirrorMediaEnv,
  platform: string,
  platformPostId: string,
  sourceUrl: string | null | undefined
): Promise<string | null> {
  if (!sourceUrl || !sourceUrl.trim()) return null;

  // Jika sudah berupa URL R2 lokal, langsung kembalikan tanpa mengunduh ulang
  if (sourceUrl.startsWith('/api/media/')) {
    return sourceUrl;
  }

  // Jika R2 belum terpasang (misal dalam lingkungan uji tanpa R2), pertahankan URL asli
  if (!env.MEDIA_BUCKET) {
    return sourceUrl;
  }

  const sanitizedId = platformPostId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${platform}_${sanitizedId}.jpg`;
  const key = `thumbnails/${filename}`;
  const publicPath = `/api/media/thumbnails/${filename}`;

  try {
    // 1. Cek apakah objek sudah pernah tersimpan di R2 (0 byte transfer)
    const existing = await env.MEDIA_BUCKET.head(key);
    if (existing) {
      return publicPath;
    }

    // 2. Unduh file biner gambar dari URL sumber dengan timeout defensif 7 detik
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const fetchRes = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timeoutId);

    if (!fetchRes.ok) {
      console.warn(
        `[R2 Mirror] Download thumbnail gagal untuk ${platform}:${platformPostId} (HTTP ${fetchRes.status})`
      );
      return sourceUrl;
    }

    const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await fetchRes.arrayBuffer();

    // Pastikan respon berupa data biner gambar yang valid (minimal > 500 bytes)
    if (buffer.byteLength < 500) {
      console.warn(
        `[R2 Mirror] File gambar terlalu kecil (${buffer.byteLength} bytes), kemungkinan error page.`
      );
      return sourceUrl;
    }

    // 3. Simpan permanen ke Cloudflare R2 dengan metadata HTTP Cache 1 tahun (immutable)
    await env.MEDIA_BUCKET.put(key, buffer, {
      httpMetadata: {
        contentType: contentType.includes('image') ? contentType : 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: {
        platform,
        platformPostId,
        mirroredAt: new Date().toISOString(),
      },
    });

    console.log(
      `[R2 Mirror] Berhasil menyimpan thumbnail permanen: ${key} (${buffer.byteLength} bytes)`
    );
    return publicPath;
  } catch (err: any) {
    console.warn(`[R2 Mirror Notice] Gagal mem-mirror thumbnail ${key}:`, err.message);
    return sourceUrl;
  }
}

