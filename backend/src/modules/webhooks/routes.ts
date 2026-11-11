import { Hono } from 'hono';
import { ensureSocialTables, extractUser } from '../composio/routes';
import type { Bindings, Variables } from '../../worker';

export const webhookRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Default fallback verify token for Meta Webhooks
const DEFAULT_META_VERIFY_TOKEN = 'firenalytics_meta_webhook_secret';

/**
 * Resolves a valid project_id and user_id that strictly exist in database
 * to satisfy SQLite foreign key constraints:
 * FOREIGN KEY (project_id) REFERENCES projects(id)
 * FOREIGN KEY (user_id) REFERENCES users(id)
 */
async function resolveValidProjectAndUser(
  db: D1Database,
  preferredProjectId?: string | null,
  preferredUserId?: string | null
): Promise<{ projectId: string; userId: string }> {
  let resolvedProject: any = null;
  let resolvedUser: any = null;

  // 1. Try finding the preferred project
  if (preferredProjectId && preferredProjectId !== 'prj_default') {
    resolvedProject = await db.prepare(
      `SELECT id, owner_id FROM projects WHERE id = ? LIMIT 1;`
    )
      .bind(preferredProjectId)
      .first();
  }

  // 2. If not found, try fallback to any project
  if (!resolvedProject) {
    resolvedProject = await db.prepare(
      `SELECT id, owner_id FROM projects ORDER BY created_at ASC LIMIT 1;`
    ).first();
  }

  // 3. Try finding the preferred user
  if (preferredUserId && preferredUserId !== 'usr_default') {
    resolvedUser = await db.prepare(
      `SELECT id FROM users WHERE id = ? LIMIT 1;`
    )
      .bind(preferredUserId)
      .first();
  }

  // 4. If not found, use project owner
  if (!resolvedUser && resolvedProject?.owner_id) {
    resolvedUser = await db.prepare(
      `SELECT id FROM users WHERE id = ? LIMIT 1;`
    )
      .bind(resolvedProject.owner_id)
      .first();
  }

  // 5. If still no user, find the first existing user in the database
  if (!resolvedUser) {
    resolvedUser = await db.prepare(
      `SELECT id FROM users ORDER BY created_at ASC LIMIT 1;`
    ).first();
  }

  // 6. Guarantee project existence if table was empty
  if (!resolvedProject) {
    const validUserId = resolvedUser?.id || 'usr_seed_epicerie';
    const fallbackProjectId = 'prj_default';
    await db.prepare(
      `INSERT OR IGNORE INTO projects (id, name, owner_id, write_key, is_active)
       VALUES (?, 'Default Workspace', ?, 'pk_live_default', 1);`
    )
      .bind(fallbackProjectId, validUserId)
      .run();

    resolvedProject = { id: fallbackProjectId, owner_id: validUserId };
  }

  return {
    projectId: resolvedProject.id,
    userId: resolvedUser?.id || resolvedProject.owner_id,
  };
}

// -------------------------------------------------------------
// GET /api/webhooks/meta (Meta Webhook Verification Handshake)
// Meta sends a GET request to verify the callback URL & secret token
// -------------------------------------------------------------
webhookRouter.get('/meta', async (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  const expectedToken = c.env.META_WEBHOOK_VERIFY_TOKEN || DEFAULT_META_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Meta Webhook] Verification successful. Handshake confirmed for mode: subscribe');
    return c.text(challenge || 'ok', 200);
  }

  console.warn('[Meta Webhook] Verification rejected. Token mismatch or invalid mode:', { mode, token });
  return c.text('Forbidden: Invalid verify token', 403);
});

// -------------------------------------------------------------
// POST /api/webhooks/meta (Meta Real-Time Inbound Event Ingestion)
// Receives inbound messages from Instagram DM, WhatsApp Cloud API, and Messenger
// -------------------------------------------------------------
webhookRouter.post('/meta', async (c) => {
  try {
    await ensureSocialTables(c.env.DB);

    const body: any = await c.req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Invalid JSON payload' }, 400);
    }

    const objectType = String(body.object || '').toLowerCase();
    console.log(`[Meta Webhook] Inbound notification received for object: ${objectType}`);

    let processedCount = 0;

    // 1. Process Instagram Messaging Events
    if (objectType === 'instagram') {
      const entries = Array.isArray(body.entry) ? body.entry : [];
      for (const entry of entries) {
        const businessAccountId = String(entry.id || '').trim();
        const messagingList = Array.isArray(entry.messaging) ? entry.messaging : [];

        // Match connection by account id / platform
        let connRow: any = null;
        if (businessAccountId) {
          connRow = await c.env.DB.prepare(
            `SELECT id, user_id, project_id, account_handle FROM social_connections 
             WHERE platform = 'instagram' AND (composio_connection_id LIKE ? OR account_handle LIKE ?) LIMIT 1;`
          )
            .bind(`%${businessAccountId}%`, `%${businessAccountId}%`)
            .first();
        }

        if (!connRow) {
          connRow = await c.env.DB.prepare(
            `SELECT id, user_id, project_id, account_handle FROM social_connections 
             WHERE platform = 'instagram' AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1;`
          ).first();
        }

        const { projectId: effectiveProjectId, userId: effectiveUserId } = await resolveValidProjectAndUser(
          c.env.DB,
          connRow?.project_id,
          connRow?.user_id
        );
        const connectionId = connRow?.id || null;

        for (const item of messagingList) {
          const senderId = String(item.sender?.id || '').trim();
          const recipientId = String(item.recipient?.id || '').trim();

          // Skip messages sent by our own business account
          if (senderId === businessAccountId || senderId === connRow?.account_handle) {
            continue;
          }

          if (!senderId) continue;

          // Extract message text or story/reaction
          let messageText = '';
          if (item.message) {
            if (typeof item.message.text === 'string' && item.message.text.trim()) {
              messageText = item.message.text.trim();
            } else if (item.message.story && typeof item.message.story.text === 'string') {
              messageText = `[Membalas Cerita Instagram]: ${item.message.story.text.trim()}`;
            } else if (item.message.attachments && Array.isArray(item.message.attachments)) {
              messageText = '[Mengirim Lampiran / Media Instagram]';
            } else {
              messageText = 'Pesan masuk Instagram';
            }
          } else if (item.reaction) {
            messageText = `[Memberikan Reaksi ${item.reaction.emoji || item.reaction.reaction || '❤️'}]`;
          } else {
            messageText = 'Pesan masuk Instagram';
          }

          const mid = item.message?.mid || `mid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const senderHandle = `@ig_user_${senderId.slice(-4)}`;
          const senderName = `Pengguna Instagram (${senderId.slice(-4)})`;

          await ingestLeadEvent(c.env.DB, {
            projectId: effectiveProjectId,
            userId: effectiveUserId,
            connectionId,
            platform: 'instagram',
            externalSenderId: senderId,
            senderName,
            senderHandle,
            messageText,
            threadId: recipientId ? `t_${senderId}_${recipientId}` : null,
            messageId: mid,
            sourceAttribution: 'meta_webhook_instagram',
          });

          processedCount++;
        }
      }
    }

    // 2. Process WhatsApp Business Cloud API Events
    else if (objectType === 'whatsapp_business_account') {
      const entries = Array.isArray(body.entry) ? body.entry : [];
      for (const entry of entries) {
        const changes = Array.isArray(entry.changes) ? entry.changes : [];
        for (const ch of changes) {
          if (ch.field !== 'messages') continue;
          const val = ch.value;
          if (!val) continue;

          const phoneNumberId = String(val.metadata?.phone_number_id || '').trim();
          const contacts = Array.isArray(val.contacts) ? val.contacts : [];
          const messages = Array.isArray(val.messages) ? val.messages : [];

          // Match connection by phone number or platform
          let connRow: any = null;
          if (phoneNumberId) {
            connRow = await c.env.DB.prepare(
              `SELECT id, user_id, project_id FROM social_connections 
               WHERE platform = 'whatsapp' AND (composio_connection_id LIKE ? OR account_handle LIKE ?) LIMIT 1;`
            )
              .bind(`%${phoneNumberId}%`, `%${phoneNumberId}%`)
              .first();
          }

          if (!connRow) {
            connRow = await c.env.DB.prepare(
              `SELECT id, user_id, project_id FROM social_connections 
               WHERE platform = 'whatsapp' AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1;`
            ).first();
          }

          const { projectId: effectiveProjectId, userId: effectiveUserId } = await resolveValidProjectAndUser(
            c.env.DB,
            connRow?.project_id,
            connRow?.user_id
          );
          const connectionId = connRow?.id || null;

          for (const m of messages) {
            const senderPhone = String(m.from || '').trim();
            if (!senderPhone) continue;

            const contactObj = contacts.find((ct: any) => ct.wa_id === senderPhone) || contacts[0];
            const senderName = contactObj?.profile?.name || `Kontak WhatsApp (+${senderPhone})`;
            const senderHandle = `+${senderPhone.replace('+', '')}`;

            let messageText = '';
            if (m.type === 'text' && m.text?.body) {
              messageText = String(m.text.body).trim();
            } else if (m.type === 'button' && m.button?.text) {
              messageText = `[Tombol Diklik]: ${m.button.text}`;
            } else if (m.type === 'interactive') {
              messageText = `[Interaktif]: ${m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || 'Pilihan'}`;
            } else if (m.type === 'image' || m.type === 'video' || m.type === 'document') {
              messageText = `[Mengirim Dokumen/Media ${m.type.toUpperCase()}]`;
            } else {
              messageText = 'Pesan masuk WhatsApp';
            }

            const wamid = m.id || `wamid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            await ingestLeadEvent(c.env.DB, {
              projectId: effectiveProjectId,
              userId: effectiveUserId,
              connectionId,
              platform: 'whatsapp',
              externalSenderId: senderPhone,
              senderName,
              senderHandle,
              messageText,
              threadId: `wa_${senderPhone}`,
              messageId: wamid,
              sourceAttribution: 'meta_webhook_whatsapp',
            });

            processedCount++;
          }
        }
      }
    }

    // 3. Process Facebook Messenger Events
    else if (objectType === 'page') {
      const entries = Array.isArray(body.entry) ? body.entry : [];
      for (const entry of entries) {
        const pageId = String(entry.id || '').trim();
        const messagingList = Array.isArray(entry.messaging) ? entry.messaging : [];

        let connRow: any = await c.env.DB.prepare(
          `SELECT id, user_id, project_id FROM social_connections 
           WHERE platform = 'facebook' AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1;`
        ).first();

        const { projectId: effectiveProjectId, userId: effectiveUserId } = await resolveValidProjectAndUser(
          c.env.DB,
          connRow?.project_id,
          connRow?.user_id
        );
        const connectionId = connRow?.id || null;

        for (const item of messagingList) {
          const senderId = String(item.sender?.id || '').trim();
          if (!senderId || senderId === pageId) continue;

          let messageText = '';
          if (item.message?.text) {
            messageText = String(item.message.text).trim();
          } else if (item.message?.attachments) {
            messageText = '[Mengirim Lampiran Messenger]';
          } else {
            messageText = 'Pesan masuk Messenger';
          }

          const mid = item.message?.mid || `mid_fb_${Date.now()}`;
          const senderHandle = `fb_user_${senderId.slice(-4)}`;
          const senderName = `Pengguna Messenger (${senderId.slice(-4)})`;

          await ingestLeadEvent(c.env.DB, {
            projectId: effectiveProjectId,
            userId: effectiveUserId,
            connectionId,
            platform: 'facebook',
            externalSenderId: senderId,
            senderName,
            senderHandle,
            messageText,
            threadId: `fb_${senderId}`,
            messageId: mid,
            sourceAttribution: 'meta_webhook_messenger',
          });

          processedCount++;
        }
      }
    }

    // Always acknowledge Meta with 200 OK within 5s
    return c.json({ status: 'EVENT_RECEIVED', processedCount }, 200);
  } catch (err: any) {
    console.error('[Meta Webhook Error]', err.message);
    // Even on error, return 200 so Meta does not spam retries, but log clearly
    return c.json({ status: 'EVENT_RECEIVED', error: err.message }, 200);
  }
});

// -------------------------------------------------------------
// POST /api/webhooks/leads (Universal Website / Landing Page Form Webhook)
// Allows direct ingestion of leads from custom landing pages, Webflow, Typeform, etc.
// -------------------------------------------------------------
webhookRouter.post('/leads', async (c) => {
  try {
    await ensureSocialTables(c.env.DB);
    const body: any = await c.req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return c.json({ success: false, error: 'Bad Request: JSON payload diperlukan' }, 400);
    }

    const projectId = String(body.projectId || c.req.query('projectId') || '').trim() || null;
    const platform = String(body.platform || 'website').toLowerCase();
    const senderName = String(body.name || body.senderName || 'Pengunjung Website').trim();
    const externalSenderId = String(
      body.phone || body.email || body.senderId || `web_${Date.now()}`
    ).trim();
    const senderHandle = String(body.email || body.phone || body.handle || '').trim() || null;
    const messageText = String(
      body.message || body.notes || body.inquiry || 'Inquiry formulir kontak website'
    ).trim();
    const dealValue = Number(body.dealValue) || 0;
    const source = String(body.source || body.sourceAttribution || 'form_webhook').trim();

    // Resolve valid project and user from database
    const { projectId: effectiveProjectId, userId: effectiveUserId } = await resolveValidProjectAndUser(
      c.env.DB,
      projectId,
      null
    );

    const result = await ingestLeadEvent(c.env.DB, {
      projectId: effectiveProjectId,
      userId: effectiveUserId,
      connectionId: null,
      platform,
      externalSenderId,
      senderName,
      senderHandle,
      messageText,
      threadId: null,
      dealValue,
      messageId: `form_${Date.now()}`,
      sourceAttribution: source,
    });

    return c.json({
      success: true,
      message: 'Lead berhasil diterima dan disinkronkan secara real-time via Webhook!',
      data: result,
    }, 201);
  } catch (err: any) {
    console.error('[Webhooks Leads Ingestion Error]', err.message);
    return c.json({ success: false, error: err.message || 'Gagal memproses webhook' }, 500);
  }
});

// -------------------------------------------------------------
// POST /api/webhooks/test-simulate (Interactive Webhook Simulation)
// Allows admins & developers to fire realistic mock Meta & WA webhooks
// -------------------------------------------------------------
webhookRouter.post('/test-simulate', async (c) => {
  try {
    await ensureSocialTables(c.env.DB);
    const body: any = await c.req.json().catch(() => ({}));

    const platform = String(body.platform || 'instagram').toLowerCase();
    const projectId = String(body.projectId || '').trim() || null;
    const senderName = String(body.senderName || (platform === 'whatsapp' ? 'Budi Pratama (Simulasi WA)' : 'Rian Santoso (Simulasi IG)')).trim();
    const senderHandle = String(body.senderHandle || (platform === 'whatsapp' ? '+6281298765432' : '@rian_simulasi')).trim();
    const messageText = String(body.messageText || 'Halo min, saya tertarik dengan layanan FireUp. Bisa minta pricelist dan jadwal diskusi?').trim();
    const externalSenderId = String(body.externalSenderId || (platform === 'whatsapp' ? '6281298765432' : `sim_user_${Date.now().toString().slice(-6)}`)).trim();

    // Try extracting authenticated user from cookie/token or resolve valid project and user
    const authUser = await extractUser(c);
    const { projectId: effectiveProjectId, userId: effectiveUserId } = await resolveValidProjectAndUser(
      c.env.DB,
      projectId,
      authUser?.id
    );

    const result = await ingestLeadEvent(c.env.DB, {
      projectId: effectiveProjectId,
      userId: effectiveUserId,
      connectionId: null,
      platform,
      externalSenderId,
      senderName,
      senderHandle,
      messageText,
      threadId: `sim_thread_${Date.now()}`,
      messageId: `sim_msg_${Date.now()}`,
      sourceAttribution: 'webhook_test_simulation',
    });

    return c.json({
      success: true,
      message: `Simulasi pesan webhook real-time untuk ${platform.toUpperCase()} berhasil diproses!`,
      data: result,
    });
  } catch (err: any) {
    console.error('[Webhook Test Simulation Error]', err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// -------------------------------------------------------------
// Helper: Core Ingestion Logic into Cloudflare D1
// Idempotently saves new inbound message or creates new lead
// -------------------------------------------------------------
interface IngestLeadPayload {
  projectId: string;
  userId: string;
  connectionId?: string | null;
  platform: string;
  externalSenderId: string;
  senderName: string;
  senderHandle: string | null;
  messageText: string;
  threadId?: string | null;
  messageId: string;
  dealValue?: number;
  sourceAttribution: string;
}

async function ingestLeadEvent(db: D1Database, p: IngestLeadPayload) {
  const nowIso = new Date().toISOString();

  // 1. Check if lead already exists by (project_id, platform, external_sender_id)
  const existingLead: any = await db.prepare(
    `SELECT id, status, notes, raw_metadata, deal_value, first_contact_at 
     FROM inbound_leads 
     WHERE project_id = ? AND platform = ? AND external_sender_id = ? LIMIT 1;`
  )
    .bind(p.projectId, p.platform, p.externalSenderId)
    .first();

  const newChatEntry = {
    id: p.messageId,
    author: p.senderHandle || p.senderName || 'Customer',
    type: 'chat',
    direction: 'inbound',
    text: p.messageText,
    createdAt: nowIso,
  };

  if (existingLead) {
    // Lead exists: append message to notes thread and update last contact
    let existingNotes: any[] = [];
    try {
      if (existingLead.notes) {
        const parsed = JSON.parse(existingLead.notes);
        if (Array.isArray(parsed)) existingNotes = parsed;
      }
    } catch {}

    // Avoid duplicate message appending if webhook retries
    const isDup = existingNotes.some((n) => n.id === p.messageId || (n.text === p.messageText && Math.abs(new Date(n.createdAt).getTime() - new Date(nowIso).getTime()) < 3000));
    if (!isDup) {
      existingNotes.push(newChatEntry);
    }

    // Preserve initial inquiry if not set
    let meta: any = {};
    try {
      meta = existingLead.raw_metadata ? JSON.parse(existingLead.raw_metadata) : {};
    } catch {}
    if (!meta.initialInquiry) {
      meta.initialInquiry = p.messageText;
    }

    // Reactivate lost/spam if customer messages again
    let nextStatus = existingLead.status;
    if (nextStatus === 'LOST' || nextStatus === 'SPAM') {
      nextStatus = 'NEW';
    }

    await db.prepare(
      `UPDATE inbound_leads 
       SET last_message = ?,
           last_message_direction = 'inbound',
           last_contact_at = ?,
           unread = 1,
           notes = ?,
           raw_metadata = ?,
           status = ?
       WHERE id = ?;`
    )
      .bind(
        p.messageText,
        nowIso,
        JSON.stringify(existingNotes),
        JSON.stringify(meta),
        nextStatus,
        existingLead.id
      )
      .run();

    return {
      action: 'UPDATED',
      leadId: existingLead.id,
      platform: p.platform,
      sender: p.senderHandle || p.senderName,
      message: p.messageText,
    };
  } else {
    // New Lead Ingestion
    const leadId = `lead_${p.platform}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const initialNotes = [newChatEntry];
    const initialMetadata = {
      initialInquiry: p.messageText,
      source: p.sourceAttribution,
      ingestedVia: 'realtime_webhook',
      externalSenderId: p.externalSenderId,
    };

    await db.prepare(
      `INSERT INTO inbound_leads (
         id, project_id, user_id, connection_id, platform, external_sender_id,
         sender_name, sender_handle, last_message, thread_id, status,
         source_attribution, deal_value, notes, unread, raw_metadata,
         last_message_direction, first_contact_at, last_contact_at, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?, 1, ?, 'inbound', ?, ?, ?);`
    )
      .bind(
        leadId,
        p.projectId,
        p.userId,
        p.connectionId || null,
        p.platform,
        p.externalSenderId,
        p.senderName,
        p.senderHandle,
        p.messageText,
        p.threadId || null,
        p.sourceAttribution,
        p.dealValue || 0,
        JSON.stringify(initialNotes),
        JSON.stringify(initialMetadata),
        nowIso,
        nowIso,
        nowIso
      )
      .run();

    return {
      action: 'CREATED',
      leadId,
      platform: p.platform,
      sender: p.senderHandle || p.senderName,
      message: p.messageText,
    };
  }
}
