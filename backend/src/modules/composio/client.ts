import { Composio } from '@composio/core';

let composioInstance: Composio | null = null;
let currentApiKey: string | null = null;

/**
 * Singleton factory for Composio v3 Client.
 * Compliant with Edge execution environments and Cloudflare Workers nodejs_compat.
 */
export function getComposioClient(apiKey?: string): Composio {
  const resolvedKey = (apiKey || '').trim();

  if (!resolvedKey) {
    throw new Error(
      'Composio API Key is missing. Please configure COMPOSIO_API_KEY in Cloudflare Worker secrets or wrangler.toml.'
    );
  }

  if (!composioInstance || currentApiKey !== resolvedKey) {
    composioInstance = new Composio({
      apiKey: resolvedKey,
    });
    currentApiKey = resolvedKey;
  }

  return composioInstance;
}

