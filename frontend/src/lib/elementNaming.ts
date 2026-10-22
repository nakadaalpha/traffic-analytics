/**
 * elementNaming.ts
 * Utilitas cerdas untuk normalisasi, deteksi platform sosial media,
 * dan penamaan otomatis elemen CTA (Smart Auto-Naming).
 */

export interface FormattedElementName {
  displayName: string;
  rawId: string;
  isCustom: boolean;
  isAutoNamed: boolean;
  brandLabel: string | null;
  contextLabel: string | null;
  suggestion: string;
}

interface PlatformDefinition {
  brand: string;
  keywords: string[];
}

const KNOWN_PLATFORMS: PlatformDefinition[] = [
  { brand: 'WhatsApp', keywords: ['whatsapp', 'wa.me', 'wa'] },
  { brand: 'Instagram', keywords: ['instagram', 'ig'] },
  { brand: 'LinkedIn', keywords: ['linkedin'] },
  { brand: 'GitHub', keywords: ['github', 'git'] },
  { brand: 'Email', keywords: ['gmail', 'email', 'mailto'] },
  { brand: 'YouTube', keywords: ['youtube', 'yt'] },
  { brand: 'X / Twitter', keywords: ['twitter', 'x.com', 'xcom', 'x-com'] },
  { brand: 'Telegram', keywords: ['telegram', 't.me', 'tme'] },
  { brand: 'Facebook', keywords: ['facebook', 'fb'] },
  { brand: 'TikTok', keywords: ['tiktok'] },
];

const GENERIC_PREFIXES_SUFFIXES = new Set([
  'btn',
  'button',
  'cta',
  'link',
  'icon',
  'action',
  'click',
  'href',
]);

/**
 * Format string slug ke Title Case yang rapi (misal: "portfolio-contact" -> "Portfolio Contact")
 */
function toTitleCase(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Mengurai ID teknis elemen menjadi nama ramah otomatis
 */
export function resolveElementName(
  rawId: string | null | undefined,
  customDisplayName?: string | null
): FormattedElementName {
  const safeId = (rawId || '').trim();

  // 1. Jika pengguna sudah menyetel nama kustom, prioritaskan nama tersebut
  if (customDisplayName && customDisplayName.trim()) {
    const trimmedCustom = customDisplayName.trim();
    return {
      displayName: trimmedCustom,
      rawId: safeId,
      isCustom: true,
      isAutoNamed: false,
      brandLabel: null,
      contextLabel: null,
      suggestion: trimmedCustom,
    };
  }

  if (!safeId) {
    return {
      displayName: '-',
      rawId: '',
      isCustom: false,
      isAutoNamed: false,
      brandLabel: null,
      contextLabel: null,
      suggestion: '',
    };
  }

  // 2. Analisis platform & kata kunci
  const lower = safeId.toLowerCase();
  let matchedPlatform: PlatformDefinition | null = null;
  let matchedKeyword = '';

  for (const plat of KNOWN_PLATFORMS) {
    for (const kw of plat.keywords) {
      // Cocokkan jika merupakan bagian dari token atau substring
      const regex = new RegExp(`(^|[-_.])${kw}([-_.]|$)`, 'i');
      if (regex.test(lower) || (kw.length >= 4 && lower.includes(kw))) {
        matchedPlatform = plat;
        matchedKeyword = kw;
        break;
      }
    }
    if (matchedPlatform) break;
  }

  // Jika bukan sosial media / platform yang dikenali, kembalikan ID mentah
  if (!matchedPlatform) {
    return {
      displayName: safeId,
      rawId: safeId,
      isCustom: false,
      isAutoNamed: false,
      brandLabel: null,
      contextLabel: null,
      suggestion: safeId.replace(/^btn-|^cta-|^link-/, '').split(/[-_]+/).map(toTitleCase).join(' '),
    };
  }

  // 3. Ekstraksi konteks tambahan (misal: "portfolio-contact-whatsapp" -> context: "Portfolio Contact")
  // Pisahkan string berdasarkan delimiter
  const tokens = safeId
    .split(/[-_.]+/)
    .filter(Boolean);

  const contextWords: string[] = [];
  let brandConsumed = false;

  for (const token of tokens) {
    const tokenLower = token.toLowerCase();

    // Hapus token brand sekali
    if (!brandConsumed && (tokenLower === matchedKeyword || tokenLower.includes(matchedKeyword))) {
      brandConsumed = true;
      continue;
    }

    // Abaikan prefix/suffix generik seperti 'btn', 'cta', 'link'
    if (GENERIC_PREFIXES_SUFFIXES.has(tokenLower)) {
      continue;
    }

    contextWords.push(toTitleCase(token));
  }

  const contextLabel = contextWords.join(' ');
  const brandLabel = matchedPlatform.brand;

  let autoName = brandLabel;
  if (contextLabel) {
    autoName = `${brandLabel} (${contextLabel})`;
  }

  return {
    displayName: autoName,
    rawId: safeId,
    isCustom: false,
    isAutoNamed: true,
    brandLabel,
    contextLabel: contextLabel || null,
    suggestion: autoName,
  };
}

/**
 * Helper style warna badge sesuai platform sosial media
 */
export function getBrandBadgeStyle(brand: string | null) {
  if (!brand) {
    return {
      pill: 'bg-zinc-100 border-zinc-200 text-zinc-800',
      dot: 'bg-zinc-400',
    };
  }
  const lower = brand.toLowerCase();
  if (lower.includes('whatsapp')) {
    return {
      pill: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      dot: 'bg-emerald-500',
    };
  }
  if (lower.includes('instagram')) {
    return {
      pill: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800',
      dot: 'bg-fuchsia-600',
    };
  }
  if (lower.includes('email') || lower.includes('gmail')) {
    return {
      pill: 'bg-red-50 border-red-200 text-red-800',
      dot: 'bg-red-600',
    };
  }
  if (lower.includes('linkedin')) {
    return {
      pill: 'bg-sky-50 border-sky-200 text-sky-800',
      dot: 'bg-sky-600',
    };
  }
  if (lower.includes('github')) {
    return {
      pill: 'bg-slate-100 border-slate-300 text-slate-900',
      dot: 'bg-slate-700',
    };
  }
  if (lower.includes('youtube')) {
    return {
      pill: 'bg-red-50 border-red-200 text-red-900',
      dot: 'bg-red-500',
    };
  }
  if (lower.includes('twitter') || lower.includes('x')) {
    return {
      pill: 'bg-zinc-100 border-zinc-300 text-zinc-900',
      dot: 'bg-zinc-900',
    };
  }
  if (lower.includes('telegram')) {
    return {
      pill: 'bg-sky-50 border-sky-200 text-sky-900',
      dot: 'bg-sky-500',
    };
  }
  if (lower.includes('facebook')) {
    return {
      pill: 'bg-blue-50 border-blue-200 text-blue-900',
      dot: 'bg-blue-600',
    };
  }
  if (lower.includes('tiktok')) {
    return {
      pill: 'bg-zinc-100 border-zinc-300 text-zinc-900',
      dot: 'bg-zinc-900',
    };
  }
  return {
    pill: 'bg-zinc-100 border-zinc-200 text-zinc-800',
    dot: 'bg-zinc-400',
  };
}

