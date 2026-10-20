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
  var projectId = currentScript.getAttribute('data-project-id') || currentScript.getAttribute('data-website-id') || 'prj_default';
  var writeKey = currentScript.getAttribute('data-write-key') || 'pk_live_demo12345';
  
  // Endpoint backend default ke Cloudflare Workers
  var endpoint =
    currentScript.getAttribute('data-endpoint') ||
    'https://traffic-analytics-api.fireup-dist.workers.dev/api/track/click';

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
  var COOLDOWN_MS = 500;

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

  // Global Event Delegation listener
  document.addEventListener(
    'click',
    function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== 'function') return;

      var cta = target.closest('[data-track-cta]');
      if (!cta) return;

      var elementId = cta.getAttribute('data-track-cta');
      if (elementId) {
        sendTracking(elementId.trim());
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
