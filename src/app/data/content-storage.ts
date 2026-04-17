import { defaultContent } from './default-content';
import type { ServiceItem, SiteContent } from '../types/site-content';

const AUTH_KEY = 'jip-admin-auth';
const FETCH_TIMEOUT_MS = 25000;
const FETCH_MAX_RETRIES = 3;
const SAVE_TIMEOUT_MS = 15000;
const SAVE_MAX_RETRIES = 2;

export type SaveResult = {
  ok: boolean;
  savedLocal: boolean;
  savedRemote: boolean;
  message: string;
};

function isSameContent(a: SiteContent, b: SiteContent): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function putContentWithRetry(payload: unknown): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= SAVE_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS);

    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);
      return response;
    } catch (error) {
      window.clearTimeout(timeoutId);
      lastError = error;

      if (attempt >= SAVE_MAX_RETRIES) {
        throw error;
      }

      await wait(350 * attempt);
    }
  }

  throw lastError;
}

async function getContentWithRetry(): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= FETCH_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch('/api/content', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);
      return response;
    } catch (error) {
      window.clearTimeout(timeoutId);
      lastError = error;

      if (attempt >= FETCH_MAX_RETRIES) {
        throw error;
      }

      await wait(300 * attempt);
    }
  }

  throw lastError;
}

async function verifyRemoteContent(expected: SiteContent): Promise<boolean> {
  try {
    const response = await fetch('/api/content', { method: 'GET', cache: 'no-store' });
    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { content?: unknown };
    if (!isValidContent(data.content)) {
      return false;
    }

    const normalizedRemote = normalizeSiteContent(data.content);
    return isSameContent(normalizedRemote, expected);
  } catch {
    return false;
  }
}

function isValidContent(parsed: unknown): parsed is SiteContent {
  if (!parsed || typeof parsed !== 'object') {
    return false;
  }
  const normalized = normalizeSiteContent(parsed);
  return Boolean(normalized.home && normalized.about && normalized.services && normalized.gallery && normalized.contact);
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }
  return input as Record<string, unknown>;
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return '';
}

function normalizeSiteContent(raw: unknown): SiteContent {
  const obj = asRecord(raw);
  const about = asRecord(obj.about);
  const servicesRaw = obj.services;
  const servicesObj = asRecord(servicesRaw);
  const galleryRaw = obj.gallery;
  const galleryObj = asRecord(galleryRaw);
  const contact = asRecord(obj.contact);
  const home = asRecord(obj.home);
  const aboutTrustIndicators = Array.isArray(about.trustIndicators)
    ? about.trustIndicators
    : defaultContent.about.trustIndicators;

  const legacyServicesArray = Array.isArray(servicesRaw) ? servicesRaw : undefined;
  const legacyGalleryArray = Array.isArray(galleryRaw) ? galleryRaw : undefined;
  const fallbackServiceItem: ServiceItem = {
    id: 1,
    title: '',
    description: '',
    items: [],
    icon: 'zap',
  };
  const fallbackGalleryItem = {
    id: 1,
    category: 'Lainnya',
    image: '',
    title: '',
    description: '',
  };
  const serviceItemsSource =
    Array.isArray(servicesObj.items)
      ? servicesObj.items
      : legacyServicesArray ?? defaultContent.services.items;

  return {
    home: {
      badge: firstNonEmptyString(home.badge, home.heroBadge, defaultContent.home.badge),
      title: firstNonEmptyString(home.title, home.heroTitle, defaultContent.home.title),
      description: firstNonEmptyString(home.description, home.heroDescription, defaultContent.home.description),
      heroImage: typeof home.heroImage === 'string' ? home.heroImage : defaultContent.home.heroImage,
      heroImageAlt: typeof home.heroImageAlt === 'string' ? home.heroImageAlt : defaultContent.home.heroImageAlt,
      primaryCtaText:
        typeof home.primaryCtaText === 'string' ? home.primaryCtaText : defaultContent.home.primaryCtaText,
      secondaryCtaText:
        typeof home.secondaryCtaText === 'string' ? home.secondaryCtaText : defaultContent.home.secondaryCtaText,
    },
    about: {
      sectionLabel:
        typeof about.sectionLabel === 'string' ? about.sectionLabel : defaultContent.about.sectionLabel,
      title: typeof about.title === 'string' ? about.title : defaultContent.about.title,
      imagePrimary:
        typeof about.imagePrimary === 'string' ? about.imagePrimary : defaultContent.about.imagePrimary,
      imagePrimaryAlt:
        typeof about.imagePrimaryAlt === 'string' ? about.imagePrimaryAlt : defaultContent.about.imagePrimaryAlt,
      imageSecondary:
        typeof about.imageSecondary === 'string' ? about.imageSecondary : defaultContent.about.imageSecondary,
      imageSecondaryAlt:
        typeof about.imageSecondaryAlt === 'string' ? about.imageSecondaryAlt : defaultContent.about.imageSecondaryAlt,
      descriptionOne:
        typeof about.descriptionOne === 'string' ? about.descriptionOne : defaultContent.about.descriptionOne,
      descriptionTwo:
        typeof about.descriptionTwo === 'string' ? about.descriptionTwo : defaultContent.about.descriptionTwo,
      experienceEnabled:
        typeof about.experienceEnabled === 'boolean'
          ? about.experienceEnabled
          : defaultContent.about.experienceEnabled,
      experienceValue:
        typeof about.experienceValue === 'string'
          ? about.experienceValue
          : defaultContent.about.experienceValue,
      experienceLabel:
        typeof about.experienceLabel === 'string'
          ? about.experienceLabel
          : defaultContent.about.experienceLabel,
      trustIndicatorsEnabled:
        typeof about.trustIndicatorsEnabled === 'boolean'
          ? about.trustIndicatorsEnabled
          : defaultContent.about.trustIndicatorsEnabled,
      trustIndicators: Array.from({ length: 4 }, (_, index) => {
        const fallback = defaultContent.about.trustIndicators[index] ?? { value: '', label: '' };
        const indicator = asRecord(aboutTrustIndicators[index]);

        return {
          value:
            typeof indicator.value === 'string'
              ? indicator.value
              : fallback.value,
          label:
            typeof indicator.label === 'string'
              ? indicator.label
              : fallback.label,
        };
      }),
    },
    services: {
      sectionLabel:
        typeof servicesObj.sectionLabel === 'string'
          ? servicesObj.sectionLabel
          : defaultContent.services.sectionLabel,
      title:
        typeof servicesObj.title === 'string' ? servicesObj.title : defaultContent.services.title,
      description:
        typeof servicesObj.description === 'string'
          ? servicesObj.description
          : defaultContent.services.description,
      items: serviceItemsSource.map((item, index): ServiceItem => {
        const rec = asRecord(item);
        const fallback =
          defaultContent.services.items[index] ?? {
            ...fallbackServiceItem,
            id: index + 1,
            icon: index % 2 === 1 ? 'ship' : 'zap',
          };
        const list = Array.isArray(rec.items) ? rec.items : fallback.items;
        return {
          id: typeof rec.id === 'number' ? rec.id : fallback.id,
          title: typeof rec.title === 'string' ? rec.title : fallback.title,
          description:
            typeof rec.description === 'string' ? rec.description : fallback.description,
          items: list
            .filter((v): v is string => typeof v === 'string')
            .map((v) => v.trim())
            .filter((v) => v.length > 0)
            .slice(0, 4),
          icon: rec.icon === 'ship' || rec.icon === 'zap' ? rec.icon : fallback.icon,
        };
      }),
    },
    gallery: {
      sectionLabel:
        typeof galleryObj.sectionLabel === 'string'
          ? galleryObj.sectionLabel
          : defaultContent.gallery.sectionLabel,
      title: typeof galleryObj.title === 'string' ? galleryObj.title : defaultContent.gallery.title,
      description:
        typeof galleryObj.description === 'string'
          ? galleryObj.description
          : defaultContent.gallery.description,
      items: (
        Array.isArray(galleryObj.items)
          ? galleryObj.items
          : legacyGalleryArray ?? defaultContent.gallery.items
      ).map((item, index) => {
        const rec = asRecord(item);
        const fallback =
          defaultContent.gallery.items[index] ?? defaultContent.gallery.items[0] ?? fallbackGalleryItem;
        return {
          id: typeof rec.id === 'number' ? rec.id : fallback.id,
          category:
            typeof rec.category === 'string' && rec.category.trim().length > 0
              ? rec.category
              : fallback.category,
          image: typeof rec.image === 'string' ? rec.image : fallback.image,
          title: typeof rec.title === 'string' ? rec.title : fallback.title,
          description:
            typeof rec.description === 'string' ? rec.description : fallback.description,
        };
      }),
    },
    contact: {
      sectionLabel:
        typeof contact.sectionLabel === 'string'
          ? contact.sectionLabel
          : defaultContent.contact.sectionLabel,
      title: typeof contact.title === 'string' ? contact.title : defaultContent.contact.title,
      description:
        typeof contact.description === 'string'
          ? contact.description
          : defaultContent.contact.description,
      emailLabel:
        typeof contact.emailLabel === 'string' ? contact.emailLabel : defaultContent.contact.emailLabel,
      emailPrimary:
        typeof contact.emailPrimary === 'string'
          ? contact.emailPrimary
          : defaultContent.contact.emailPrimary,
      emailSecondary:
        typeof contact.emailSecondary === 'string'
          ? contact.emailSecondary
          : defaultContent.contact.emailSecondary,
      phoneLabel:
        typeof contact.phoneLabel === 'string' ? contact.phoneLabel : defaultContent.contact.phoneLabel,
      phonePrimary:
        typeof contact.phonePrimary === 'string'
          ? contact.phonePrimary
          : defaultContent.contact.phonePrimary,
      phoneSecondary:
        typeof contact.phoneSecondary === 'string'
          ? contact.phoneSecondary
          : defaultContent.contact.phoneSecondary,
      addressLabel:
        typeof contact.addressLabel === 'string'
          ? contact.addressLabel
          : defaultContent.contact.addressLabel,
      address: typeof contact.address === 'string' ? contact.address : defaultContent.contact.address,
      websiteLabel:
        typeof contact.websiteLabel === 'string'
          ? contact.websiteLabel
          : defaultContent.contact.websiteLabel,
      website: typeof contact.website === 'string' ? contact.website : defaultContent.contact.website,
    },
  };
}

function loadSiteContentLocal(): SiteContent {
  // Content source of truth is database; local cache disabled.
  return defaultContent;
}

function saveSiteContentLocal(content: SiteContent): boolean {
  void content;
  // Content source of truth is database; local cache disabled.
  return true;
}

export async function fetchSiteContent(): Promise<SiteContent> {
  const response = await getContentWithRetry();
  if (!response.ok) {
    throw new Error(`Failed to fetch content: HTTP ${response.status}`);
  }

  const data = (await response.json()) as { content?: unknown };
  if (!isValidContent(data.content)) {
    throw new Error('Invalid content payload from API');
  }

  const normalized = normalizeSiteContent(data.content);
  return normalized;
}

export async function persistSiteContentPatch(contentPatch: Partial<SiteContent>): Promise<SaveResult> {
  let savedRemote = false;
  let remoteError = '';

  try {
    const response = await putContentWithRetry({ mode: 'merge', content: contentPatch });

    savedRemote = response.ok;

    if (!response.ok) {
      try {
        const data = (await response.json()) as { message?: string; detail?: string };
        remoteError = [data.message, data.detail].filter(Boolean).join(' - ');
      } catch {
        remoteError = `HTTP ${response.status}`;
      }
    }
  } catch {
    savedRemote = false;
    remoteError = 'Tidak bisa menghubungi endpoint /api/content (timeout/jaringan)';
  }

  if (savedRemote) {
    return {
      ok: true,
      savedLocal: false,
      savedRemote: true,
      message: 'Perubahan berhasil disimpan ke database.',
    };
  }

  return {
    ok: false,
    savedLocal: false,
    savedRemote: false,
    message: `Gagal menyimpan ke database.${remoteError ? ` Detail: ${remoteError}` : ''}`,
  };
}

export async function persistSiteContent(content: SiteContent): Promise<SaveResult> {
  const normalized = normalizeSiteContent(content);
  let savedRemote = false;
  let remoteError = '';

  try {
    const response = await putContentWithRetry({ content: normalized });

    savedRemote = response.ok;

    if (!response.ok) {
      try {
        const data = (await response.json()) as { message?: string; detail?: string };
        remoteError = [data.message, data.detail].filter(Boolean).join(' - ');
      } catch {
        remoteError = `HTTP ${response.status}`;
      }

      if (response.status === 404) {
        remoteError =
          'HTTP 404: endpoint /api/content tidak ditemukan. Jalankan aplikasi dengan runtime yang menyediakan API server (mis. Vercel) agar bisa sinkron ke database.';
      }
    }
  } catch {
    savedRemote = false;
    remoteError = 'Tidak bisa menghubungi endpoint /api/content (timeout/jaringan)';
  }

  if (!savedRemote) {
    const verified = await verifyRemoteContent(normalized);
    if (verified) {
      savedRemote = true;
      remoteError = '';
    }
  }

  if (savedRemote) {
    return {
      ok: true,
      savedLocal: false,
      savedRemote: true,
      message: 'Perubahan berhasil disimpan ke database.',
    };
  }

  return {
    ok: false,
    savedLocal: false,
    savedRemote: false,
    message: `Gagal menyimpan ke database.${remoteError ? ` Detail: ${remoteError}` : ''}`,
  };
}

export function trySaveSiteContent(content: SiteContent): SaveResult {
  void content;
  return {
    ok: true,
    savedLocal: false,
    savedRemote: false,
    message: 'Penyimpanan lokal dinonaktifkan. Gunakan penyimpanan database.',
  };
}

export async function restoreDefaultSiteContent(): Promise<SiteContent> {
  try {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'reset' }),
    });

    if (response.ok) {
      const data = (await response.json()) as { content?: unknown };
      if (isValidContent(data.content)) {
        const normalized = normalizeSiteContent(data.content);
        return normalized;
      }
    }
  } catch {
    // Fall through to local reset.
  }

  return defaultContent;
}

export function loadSiteContent(): SiteContent {
  return loadSiteContentLocal();
}

export function saveSiteContent(content: SiteContent): void {
  saveSiteContentLocal(content);
}

export function resetSiteContent(): SiteContent {
  saveSiteContentLocal(defaultContent);
  return defaultContent;
}

export function getAdminAuth(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(AUTH_KEY) === '1';
}

export function setAdminAuth(isAuthenticated: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (isAuthenticated) {
    window.localStorage.setItem(AUTH_KEY, '1');
    return;
  }
  window.localStorage.removeItem(AUTH_KEY);
}
