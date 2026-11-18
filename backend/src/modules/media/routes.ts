import { Hono } from 'hono';

export type MediaEnv = {
  Bindings: {
    DB?: D1Database;
    MEDIA_BUCKET?: R2Bucket;
  };
};

export const mediaRouter = new Hono<MediaEnv>();

/**
 * GET /api/media/thumbnails/*
 * Menyajikan thumbnail gambar permanen langsung dari Cloudflare R2
 * Dilengkapi kemampuan Just-In-Time (JIT) Mirroring: jika gambar belum ada di R2,
 * Worker mengunduh dari URL eksternal sekali, menyimpannya ke R2, dan menyajikannya seketika.
 */
mediaRouter.get('/thumbnails/*', async (c) => {
  const fullPath = c.req.path;
  const rawKey = fullPath.replace(/^\/api\/media\/thumbnails\//, '');
  if (!rawKey) {
    return c.text('Path thumbnail tidak valid', 400);
  }

  const decodedKey = decodeURIComponent(rawKey);
  const key = decodedKey.startsWith('thumbnails/') ? decodedKey : `thumbnails/${decodedKey}`;

  if (!c.env.MEDIA_BUCKET) {
    return c.text('Cloudflare R2 MEDIA_BUCKET belum terkonfigurasi di Worker ini', 503);
  }

  try {
    let object = await c.env.MEDIA_BUCKET.get(key);

    // Just-In-Time (JIT) Mirroring: Jika file belum ada di R2, coba ambil dari sumber eksternal
    if (!object && c.env.DB) {
      const cleanKey = key.replace(/^thumbnails\//, '').replace(/\.[a-zA-Z0-9]+$/, '');
      const parts = cleanKey.split('_');
      const platform = parts[0];
      const platformPostId = parts.slice(1).join('_');

      if (platform && platformPostId) {
        const post: any = await c.env.DB.prepare(
          `SELECT thumbnail_url FROM social_posts WHERE platform_post_id = ? OR id = ? LIMIT 1;`
        ).bind(platformPostId, platformPostId).first();

        if (post && post.thumbnail_url && post.thumbnail_url.startsWith('http')) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);
            const fetchRes = await fetch(post.thumbnail_url, {
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });
            clearTimeout(timeoutId);

            if (fetchRes.ok) {
              const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
              const buffer = await fetchRes.arrayBuffer();

              if (buffer.byteLength > 500) {
                await c.env.MEDIA_BUCKET.put(key, buffer, {
                  httpMetadata: {
                    contentType: contentType.includes('image') ? contentType : 'image/jpeg',
                    cacheControl: 'public, max-age=31536000, immutable',
                  },
                  customMetadata: {
                    platform,
                    platformPostId,
                    mirroredAt: new Date().toISOString(),
                    mode: 'JIT_ON_DEMAND',
                  },
                });

                // Update kolom thumbnail_url di database agar menunjuk ke R2 permanen
                await c.env.DB.prepare(
                  `UPDATE social_posts SET thumbnail_url = ? WHERE platform_post_id = ? OR id = ?;`
                ).bind(`/api/media/thumbnails/${key}`, platformPostId, platformPostId).run();

                object = await c.env.MEDIA_BUCKET.get(key);
              }
            }
          } catch (jitErr: any) {
            console.warn('[JIT Mirror Notice]:', jitErr.message);
          }
        }
      }
    }

    if (!object) {
      return c.text('Thumbnail tidak ditemukan di Object Storage R2', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (!headers.get('content-type')) {
      headers.set('content-type', 'image/jpeg');
    }

    return new Response(object.body, { headers });
  } catch (err: any) {
    console.error('[R2 Media Serve Error]', err.message);
    return c.text('Gagal memuat media dari penyimpanan R2', 500);
  }
});
