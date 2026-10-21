# 📖 Panduan Integrasi Universal ClickTracker PRO

Panduan praktis dan lengkap untuk mengintegrasikan pelacakan klik/CTA (*Call to Action*) ke website Anda dalam hitungan menit, baik menggunakan framework modern maupun website statis tanpa framework (Vanilla HTML).

---

## ⚡ 1. Prinsip Dasar (Hanya 2 Langkah)

Integrasi ClickTracker hanya membutuhkan dua hal sederhana:
1. **Memuat Script:** Sisipkan tag `<script>` pelacak di header/layout website Anda.
2. **Menandai Elemen:** Tambahkan atribut `data-track-cta="nama-elemen-unik"` pada tombol, tautan, atau form apa pun yang ingin dihitung kliknya.

> [!TIP]
> **Otomatis Mendukung Localhost:**
> Seluruh port pengembangan lokal (`localhost:5173`, `localhost:3000`, `localhost:8000`, dll) **otomatis diizinkan**. Anda dapat langsung menguji klik di laptop Anda sebelum di-deploy ke production!

---

## 🚀 2. Panduan Integrasi Berdasarkan Framework

### A. React + Vite (atau Create-React-App)
Cukup buka file `index.html` yang berada di folder root project Anda, lalu sisipkan script di dalam tag `<head>`:

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Website Saya</title>

    <!-- ⚡ ClickTracker Script -->
    <script
      defer
      data-project-id="GANTI_DENGAN_PROJECT_ID_ANDA"
      data-write-key="GANTI_DENGAN_WRITE_KEY_ANDA"
      src="https://firenalytics.vercel.app/tracker.js">
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

### B. Next.js 13 / 14 / 15 / 16 (App Router)
Buka file `app/layout.tsx` (atau `app/layout.js`), lalu gunakan komponen `Script` bawaan Next.js:

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <Script
          defer
          data-project-id="GANTI_DENGAN_PROJECT_ID_ANDA"
          data-write-key="GANTI_DENGAN_WRITE_KEY_ANDA"
          src="https://firenalytics.vercel.app/tracker.js"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

### C. Next.js (Pages Router)
Buka file `pages/_document.tsx` (atau `pages/_document.js`), lalu sisipkan di dalam komponen `<Head>`:

```tsx
// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        <script
          defer
          data-project-id="GANTI_DENGAN_PROJECT_ID_ANDA"
          data-write-key="GANTI_DENGAN_WRITE_KEY_ANDA"
          src="https://firenalytics.vercel.app/tracker.js"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

---

### D. Vue.js / Nuxt.js
- **Vue (Vite):** Sisipkan tag `<script>` di file `index.html` persis seperti pada panduan React (Vite).
- **Nuxt.js (nuxt.config.ts):** Tambahkan script ke properti `app.head.script`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          defer: true,
          'data-project-id': 'GANTI_DENGAN_PROJECT_ID_ANDA',
          'data-write-key': 'GANTI_DENGAN_WRITE_KEY_ANDA',
          src: 'https://firenalytics.vercel.app/tracker.js',
        },
      ],
    },
  },
});
```

---

### E. Astro
Buka file layout utama Anda (misal: `src/layouts/Layout.astro`), lalu sisipkan di tag `<head>`:

```astro
---
// src/layouts/Layout.astro
---
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <title>Website Astro</title>
    <script
      defer
      data-project-id="GANTI_DENGAN_PROJECT_ID_ANDA"
      data-write-key="GANTI_DENGAN_WRITE_KEY_ANDA"
      src="https://firenalytics.vercel.app/tracker.js"
    ></script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

---

### F. Website Statis Tanpa Framework (HTML / PHP / WordPress / Shopify / Webflow)
Cukup sisipkan tag script ini sebelum tag penutup `</head>` atau tepat sebelum tag penutup `</body>`:

```html
<!-- index.html / header.php / footer.php -->
<script
  defer
  data-project-id="GANTI_DENGAN_PROJECT_ID_ANDA"
  data-write-key="GANTI_DENGAN_WRITE_KEY_ANDA"
  src="https://firenalytics.vercel.app/tracker.js">
</script>
```

---

## 🎯 3. Cara Menandai Elemen yang Ingin Dilacak

Anda tidak perlu menulis kode JavaScript tambahan atau fungsi `onClick`. Cukup tempelkan atribut `data-track-cta="NAMA_EVENT_ANDA"` pada elemen HTML:

### 1. Tombol Chat WhatsApp:
```html
<a 
  href="https://wa.me/62812345678" 
  target="_blank" 
  data-track-cta="btn-hubungi-whatsapp"
>
  Chat via WhatsApp
</a>
```

### 2. Tombol Unduh CV / File Katalog:
```html
<a 
  href="/resume.pdf" 
  download 
  data-track-cta="btn-download-resume"
>
  Unduh Resume
</a>
```

### 3. Tombol Checkout / Keranjang Belanja:
```html
<button 
  type="button" 
  data-track-cta="btn-checkout-sekarang"
>
  Beli Sekarang
</button>
```

### 4. Tombol Submit Form Pendaftaran:
```html
<button 
  type="submit" 
  data-track-cta="form-submit-registrasi"
>
  Kirim Data
</button>
```

---

## 💡 4. Fitur Tambahan: Trigger Manual via JavaScript (Opsional)

Jika Anda memiliki logika interaksi kompleks di JavaScript (misal: tracking dipicu hanya setelah validasi form sukses), script ini menyediakan fungsi global:

```javascript
// Panggil kapan saja di file JavaScript Anda:
if (window.clickTracker) {
  window.clickTracker.track('custom-event-pembayaran-sukses');
}
```

---

## 🛡️ 5. Fitur Keamanan & Kepatuhan Standar Industri

1. **GDPR & UU PDP Masking:** Alamat IP pengunjung otomatis dianonimkan (oktet terakhir disamarkan menjadi `.0`) sebelum disimpan ke database.
2. **Non-Blocking & 0ms Delay:** Menggunakan teknologi browser `navigator.sendBeacon` sehingga pengiriman event klik tidak memperlambat navigasi pengunjung sama sekali.
3. **Anti-Spam Debounce:** Dilengkapi cooldown cerdas 500ms di memori browser untuk mencegah klik ganda tak disengaja.
4. **Isolasi Penuh Antar Pengguna:** Setiap proyek terikat ke akun pemiliknya (`owner_id`) sehingga data analitik Anda tidak dapat dilihat oleh pengguna lain.
