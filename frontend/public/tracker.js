(function () {
  'use strict';

  // Dapatkan referensi elemen <script> tracker saat ini
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  if (!currentScript) return;

  // Baca konfigurasi dari atribut HTML script tag
  var projectId =
    currentScript.getAttribute('data-project-id') ||
    currentScript.getAttribute('data-website-id') ||
    'prj_default';
  var writeKey = currentScript.getAttribute('data-write-key') || 'pk_live_demo12345';
  
  // Endpoint backend default ke Cloudflare Workers
  var endpoint =
    currentScript.getAttribute('data-endpoint') ||
    'https://traffic-analytics-api.fireup-dist.workers.dev/api/track/click';

  // Opsi Smart Auto-Capture (Aktif secara default)
  var autoCaptureEnabled = currentScript.getAttribute('data-auto-capture') !== 'false';

  // Sesi unik browser
  var STORAGE_KEY = 'cta_session_id';
  function getSessionId() {
    try {
      var sess = window.sessionStorage.getItem(STORAGE_KEY);
      if (!sess) {
        sess = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
        window.sessionStorage.setItem(STORAGE_KEY, sess);
      }
      return sess;
    } catch (e) {
      return 'sess_' + Date.now();
    }
  }

  // Cooldown debouncing untuk mencegah klik ganda tak disengaja
  var cooldownMap = {};
  var COOLDOWN_MS = 600;

  function sendTracking(elementId) {
    if (!elementId) return;

    var now = Date.now();
    if (cooldownMap[elementId] && now - cooldownMap[elementId] < COOLDOWN_MS) {
      return;
    }
    cooldownMap[elementId] = now;

    var payload = JSON.stringify({
      projectId: projectId,
      writeKey: writeKey,
      elementId: elementId,
      pagePath: window.location.pathname || '/',
      sessionId: getSessionId(),
    });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        var blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
        if (navigator.sendBeacon(endpoint, blob)) {
          return;
        }
      } catch (err) {}
    }

    // Fallback keepalive fetch
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-project-id': projectId,
          'x-write-key': writeKey,
        },
        body: payload,
        keepalive: true,
      }).catch(function () {});
    } catch (err) {}
  }

  // Helper untuk mengubah string menjadi slug bersih dan ramah metrik
  function cleanSlug(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 32);
  }

  // Logika Smart Auto-Capture: mendeteksi konteks produk dan aksi tombol secara otomatis
  function resolveAutoCaptureId(clickable) {
    if (!clickable || clickable.hasAttribute('data-track-ignore')) return null;

    // 1. Ekstrak aksi dari teks tombol / link
    var actionText = (clickable.innerText || clickable.textContent || '').trim();

    // 2. Jika tidak ada teks (misal tombol logo brand), cari tag <img> di dalamnya
    if (!actionText || actionText.length === 0) {
      var img = clickable.querySelector('img');
      if (img) {
        actionText = img.getAttribute('alt') || img.getAttribute('title') || '';
        if (actionText) {
          actionText = 'brand-' + actionText;
        }
      }
    }

    // 3. Cek atribut fallback seperti aria-label atau title
    if (!actionText) {
      actionText = clickable.getAttribute('aria-label') || clickable.getAttribute('title') || '';
    }

    // 4. Ekstrak konteks produk / item terdekat (misal kartu mobil)
    var contextText = '';
    var cardContainer = clickable.closest('[class*="card"], [class*="item"], [class*="product"], article, li');
    if (cardContainer) {
      // Cari elemen judul produk atau model mobil (h1-h4 atau kelas bertuliskan title/model/name)
      var heading = cardContainer.querySelector('h1, h2, h3, h4, [class*="model"], [class*="title"], [class*="name"]');
      if (heading && heading !== clickable && !heading.contains(clickable)) {
        contextText = (heading.innerText || heading.textContent || '').trim();
      }
    }

    var actionSlug = cleanSlug(actionText);
    var contextSlug = cleanSlug(contextText);

    if (contextSlug && actionSlug) {
      // Contoh: "812" + "explore" -> "812-explore"
      return contextSlug + '-' + actionSlug;
    } else if (contextSlug) {
      return contextSlug;
    } else if (actionSlug) {
      return actionSlug.startsWith('btn-') ? actionSlug : 'btn-' + actionSlug;
    }

    return null;
  }

  // Global Event Delegation listener
  document.addEventListener(
    'click',
    function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== 'function') return;

      // 1. Prioritas Utama: Elemen dengan atribut eksplisit data-track-cta
      var explicitCta = target.closest('[data-track-cta]');
      if (explicitCta) {
        var explicitId = explicitCta.getAttribute('data-track-cta');
        if (explicitId && explicitId.trim()) {
          sendTracking(explicitId.trim());
          return;
        }
      }

      // 2. Solusi 1: Smart Auto-Capture (jika tidak ada data-track-cta)
      if (autoCaptureEnabled) {
        var clickable = target.closest('button, a, input[type="submit"], input[type="button"], [role="button"]');
        if (clickable) {
          var autoId = resolveAutoCaptureId(clickable);
          if (autoId) {
            sendTracking(autoId);
          }
        }
      }
    },
    true
  );

  // Ekspos fungsi kustom jika user ingin tracking manual via JS: window.clickTracker.track('nama_event')
  window.clickTracker = {
    track: function (elementId) {
      sendTracking(elementId);
    },
  };
})();
