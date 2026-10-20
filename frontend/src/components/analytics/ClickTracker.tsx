'use client';

import { useEffect } from 'react';

/** Cooldown duration in milliseconds to prevent accidental click spamming */
const COOLDOWN_MS = 500;

/** In-memory storage for tracking last click timestamp per elementId */
const elementCooldownMap = new Map<string, number>();

/**
 * Mengambil session_id yang tersimpan di sessionStorage atau
 * membuat ID baru berformat sess_... jika belum ada.
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'sess_ssr_fallback';
  }

  const STORAGE_KEY = 'cta_session_id';

  try {
    let sessionId = window.sessionStorage.getItem(STORAGE_KEY);
    if (!sessionId) {
      const randomStr = Math.random().toString(36).substring(2, 12);
      const timestampStr = Date.now().toString(36);
      sessionId = `sess_${randomStr}_${timestampStr}`;
      window.sessionStorage.setItem(STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return `sess_fallback_${Date.now()}`;
  }
}

export interface ClickTrackerProps {
  /** Identifier unik project/klien. Default: NEXT_PUBLIC_TRACKING_PROJECT_ID atau 'prj_default' */
  projectId?: string;
  /** Public write key untuk autentikasi client. Default: NEXT_PUBLIC_TRACKING_WRITE_KEY */
  writeKey?: string;
  /** Endpoint API pelacakan. Default: NEXT_PUBLIC_TRACKING_API_URL atau '/api/track/click' */
  endpoint?: string;
}

/**
 * ClickTracker Component:
 * Client wrapper / listener yang mendengarkan global event delegation pada dokumen
 * untuk mendeteksi elemen dengan atribut [data-track-cta] secara aman dan multi-tenant.
 */
export function ClickTracker({
  projectId = process.env.NEXT_PUBLIC_TRACKING_PROJECT_ID || 'prj_default',
  writeKey = process.env.NEXT_PUBLIC_TRACKING_WRITE_KEY || 'pk_live_demo12345',
  endpoint = process.env.NEXT_PUBLIC_TRACKING_API_URL || '/api/track/click',
}: ClickTrackerProps): null {
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Tangkap target dengan selektor closest('[data-track-cta]')
      const ctaElement = target.closest('[data-track-cta]') as HTMLElement | null;
      if (!ctaElement) {
        return;
      }

      const elementId = ctaElement.getAttribute('data-track-cta')?.trim();
      if (!elementId) {
        return;
      }

      // Terapkan debouncing / cooldown singkat (500ms per element ID) di memori browser
      const now = Date.now();
      const lastClickedTime = elementCooldownMap.get(elementId) || 0;
      if (now - lastClickedTime < COOLDOWN_MS) {
        return;
      }
      elementCooldownMap.set(elementId, now);

      // Kelola session_id dari sessionStorage
      const sessionId = getOrCreateSessionId();
      const pagePath = window.location.pathname || '/';

      const trackingPayload = {
        projectId,
        writeKey,
        elementId,
        pagePath,
        sessionId,
      };

      // 1. Prioritaskan navigator.sendBeacon(url, blob)
      let isBeaconSent = false;
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          const blob = new Blob([JSON.stringify(trackingPayload)], {
            type: 'application/json',
          });
          isBeaconSent = navigator.sendBeacon(endpoint, blob);
        } catch (beaconError) {
          console.warn('[ClickTracker] Beacon dispatch error, using fallback:', beaconError);
          isBeaconSent = false;
        }
      }

      // 2. Fallback ke fetch dengan keepalive: true jika sendBeacon tidak didukung atau gagal
      if (!isBeaconSent) {
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-project-id': projectId,
            'x-write-key': writeKey,
          },
          body: JSON.stringify(trackingPayload),
          keepalive: true,
        }).catch((fetchErr) => {
          console.error('[ClickTracker] Tracking dispatch failed:', fetchErr);
        });
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [projectId, writeKey, endpoint]);

  return null;
}

export default ClickTracker;
