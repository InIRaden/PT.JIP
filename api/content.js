import { neon } from '@neondatabase/serverless';

const defaultContent = {
  home: {
    badge: '',
    title: '',
    description: '',
    heroImage: '',
    heroImageAlt: '',
    primaryCtaText: '',
    secondaryCtaText: '',
  },
  about: {
    sectionLabel: '',
    title: '',
    imagePrimary: '',
    imagePrimaryAlt: '',
    imageSecondary: '',
    imageSecondaryAlt: '',
    descriptionOne: '',
    descriptionTwo: '',
    experienceEnabled: false,
    experienceValue: '',
    experienceLabel: '',
  },
  services: {
    sectionLabel: '',
    title: '',
    description: '',
    items: [],
  },
  gallery: {
    sectionLabel: '',
    title: '',
    description: '',
    items: [],
  },
  contact: {
    sectionLabel: '',
    title: '',
    description: '',
    emailLabel: '',
    emailPrimary: '',
    emailSecondary: '',
    phoneLabel: '',
    phonePrimary: '',
    phoneSecondary: '',
    addressLabel: '',
    address: '',
    websiteLabel: '',
    website: '',
  },
};

const CONTENT_KEY = 'main';
const databaseUrl = process.env.DATABASE_URL;
const DB_WRITE_MAX_RETRIES = 3;
const DB_READ_MAX_RETRIES = 2;
const DB_RETRY_BASE_DELAY_MS = 250;
const READ_CACHE_TTL_MS = 30000;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for API /api/content');
}

const sql = neon(databaseUrl);

let lastKnownContent = normalizeSiteContent(defaultContent);
let ensureSchemaPromise = null;
let lastKnownContentUpdatedAt = 0;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableDatabaseError(error) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('connect_timeout') ||
    message.includes('etimedout') ||
    message.includes('econnreset') ||
    message.includes('ehostunreach') ||
    message.includes('enetunreach') ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('connection terminated') ||
    message.includes('could not connect') ||
    message.includes('timeout')
  );
}

async function withDatabaseRetry(operation, maxRetries = DB_WRITE_MAX_RETRIES) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableDatabaseError(error) || attempt >= maxRetries) {
        throw error;
      }

      const delay = DB_RETRY_BASE_DELAY_MS * attempt;
      await wait(delay);
    }
  }

  throw lastError;
}

async function parseRequestBody(req) {
  const raw = req.body;

  if (!raw) {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return {};
    }

    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const text = Buffer.concat(chunks).toString('utf8').trim();
      if (!text) {
        return {};
      }
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  if (Buffer.isBuffer(raw)) {
    try {
      return JSON.parse(raw.toString('utf8'));
    } catch {
      return {};
    }
  }

  if (typeof raw === 'object') {
    return raw;
  }

  return {};
}

function asRecord(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }
  return input;
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return '';
}

function normalizeSiteContent(raw) {
  const obj = asRecord(raw);
  const home = asRecord(obj.home);
  const about = asRecord(obj.about);
  const servicesRaw = obj.services;
  const servicesObj = asRecord(servicesRaw);
  const galleryRaw = obj.gallery;
  const galleryObj = asRecord(galleryRaw);
  const contact = asRecord(obj.contact);

  const legacyServicesArray = Array.isArray(servicesRaw) ? servicesRaw : undefined;
  const legacyGalleryArray = Array.isArray(galleryRaw) ? galleryRaw : undefined;
  const fallbackServiceItem = {
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
      description: firstNonEmptyString(
        home.description,
        home.heroDescription,
        defaultContent.home.description,
      ),
      heroImage: typeof home.heroImage === 'string' ? home.heroImage : defaultContent.home.heroImage,
      heroImageAlt: typeof home.heroImageAlt === 'string' ? home.heroImageAlt : defaultContent.home.heroImageAlt,
      primaryCtaText:
        typeof home.primaryCtaText === 'string' ? home.primaryCtaText : defaultContent.home.primaryCtaText,
      secondaryCtaText:
        typeof home.secondaryCtaText === 'string' ? home.secondaryCtaText : defaultContent.home.secondaryCtaText,
    },
    about: {
      sectionLabel: typeof about.sectionLabel === 'string' ? about.sectionLabel : defaultContent.about.sectionLabel,
      title: typeof about.title === 'string' ? about.title : defaultContent.about.title,
      imagePrimary: typeof about.imagePrimary === 'string' ? about.imagePrimary : defaultContent.about.imagePrimary,
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
    },
    services: {
      sectionLabel:
        typeof servicesObj.sectionLabel === 'string'
          ? servicesObj.sectionLabel
          : defaultContent.services.sectionLabel,
      title: typeof servicesObj.title === 'string' ? servicesObj.title : defaultContent.services.title,
      description:
        typeof servicesObj.description === 'string'
          ? servicesObj.description
          : defaultContent.services.description,
      items: serviceItemsSource.map((item, index) => {
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
          description: typeof rec.description === 'string' ? rec.description : fallback.description,
          items: list
            .filter((v) => typeof v === 'string')
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
          description: typeof rec.description === 'string' ? rec.description : fallback.description,
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
        typeof contact.description === 'string' ? contact.description : defaultContent.contact.description,
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
        typeof contact.phonePrimary === 'string' ? contact.phonePrimary : defaultContent.contact.phonePrimary,
      phoneSecondary:
        typeof contact.phoneSecondary === 'string'
          ? contact.phoneSecondary
          : defaultContent.contact.phoneSecondary,
      addressLabel:
        typeof contact.addressLabel === 'string' ? contact.addressLabel : defaultContent.contact.addressLabel,
      address: typeof contact.address === 'string' ? contact.address : defaultContent.contact.address,
      websiteLabel:
        typeof contact.websiteLabel === 'string'
          ? contact.websiteLabel
          : defaultContent.contact.websiteLabel,
      website: typeof contact.website === 'string' ? contact.website : defaultContent.contact.website,
    },
  };
}

function isValidContent(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  const raw = asRecord(data);
  const home = asRecord(raw.home);
  const about = asRecord(raw.about);
  const services = asRecord(raw.services);
  const gallery = asRecord(raw.gallery);
  const contact = asRecord(raw.contact);

  if (
    Object.keys(home).length === 0 ||
    Object.keys(about).length === 0 ||
    Object.keys(services).length === 0 ||
    Object.keys(gallery).length === 0 ||
    Object.keys(contact).length === 0
  ) {
    return false;
  }

  if (!Array.isArray(services.items) || !Array.isArray(gallery.items)) {
    return false;
  }

  const normalized = normalizeSiteContent(data);
  return Boolean(
    normalized.home &&
      normalized.about &&
      normalized.services &&
      Array.isArray(normalized.services.items) &&
      normalized.gallery &&
      Array.isArray(normalized.gallery.items) &&
      normalized.contact,
  );
}

function isPartialContentPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  const raw = asRecord(data);
  const allowedKeys = ['home', 'about', 'services', 'gallery', 'contact'];

  for (const key of allowedKeys) {
    if (key in raw) {
      const value = raw[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return true;
      }
    }
  }

  return false;
}

function mergeTopLevelContent(baseContent, patchContent) {
  const base = normalizeSiteContent(baseContent);
  const patch = asRecord(patchContent);

  return normalizeSiteContent({
    home: 'home' in patch ? asRecord(patch.home) : base.home,
    about: 'about' in patch ? asRecord(patch.about) : base.about,
    services: 'services' in patch ? asRecord(patch.services) : base.services,
    gallery: 'gallery' in patch ? asRecord(patch.gallery) : base.gallery,
    contact: 'contact' in patch ? asRecord(patch.contact) : base.contact,
  });
}

async function ensureTableSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS site_content (
      id TEXT PRIMARY KEY,
      content JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS home_content (
      singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE,
      badge TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      hero_image TEXT NOT NULL DEFAULT '',
      hero_image_alt TEXT NOT NULL DEFAULT '',
      primary_cta_text TEXT NOT NULL DEFAULT '',
      secondary_cta_text TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS about_content (
      singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE,
      section_label TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      image_primary TEXT NOT NULL DEFAULT '',
      image_primary_alt TEXT NOT NULL DEFAULT '',
      image_secondary TEXT NOT NULL DEFAULT '',
      image_secondary_alt TEXT NOT NULL DEFAULT '',
      description_one TEXT NOT NULL DEFAULT '',
      description_two TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    ALTER TABLE about_content
      ADD COLUMN IF NOT EXISTS experience_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS experience_value TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS experience_label TEXT NOT NULL DEFAULT '';
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS services_content (
      singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE,
      section_label TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS service_items (
      id BIGSERIAL PRIMARY KEY,
      sort_order INT NOT NULL DEFAULT 0,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT 'zap',
      bullet_items JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS gallery_content (
      singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE,
      section_label TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS gallery_items (
      id BIGSERIAL PRIMARY KEY,
      category TEXT NOT NULL DEFAULT 'Lainnya',
      title TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contact_content (
      singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE,
      section_label TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      email_label TEXT NOT NULL DEFAULT '',
      email_primary TEXT NOT NULL DEFAULT '',
      email_secondary TEXT NOT NULL DEFAULT '',
      phone_label TEXT NOT NULL DEFAULT '',
      phone_primary TEXT NOT NULL DEFAULT '',
      phone_secondary TEXT NOT NULL DEFAULT '',
      address_label TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      website_label TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

async function ensureTable() {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = ensureTableSchema().catch((error) => {
      ensureSchemaPromise = null;
      throw error;
    });
  }

  await ensureSchemaPromise;
}

async function writeNormalizedTables(content) {
  await sql`
    INSERT INTO home_content (
      singleton_id,
      badge,
      title,
      description,
      hero_image,
      hero_image_alt,
      primary_cta_text,
      secondary_cta_text,
      updated_at
    )
    VALUES (
      TRUE,
      ${content.home.badge},
      ${content.home.title},
      ${content.home.description},
      ${content.home.heroImage},
      ${content.home.heroImageAlt},
      ${content.home.primaryCtaText},
      ${content.home.secondaryCtaText},
      NOW()
    )
    ON CONFLICT (singleton_id)
    DO UPDATE SET
      badge = EXCLUDED.badge,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      hero_image = EXCLUDED.hero_image,
      hero_image_alt = EXCLUDED.hero_image_alt,
      primary_cta_text = EXCLUDED.primary_cta_text,
      secondary_cta_text = EXCLUDED.secondary_cta_text,
      updated_at = NOW();
  `;

  await sql`
    INSERT INTO about_content (
      singleton_id,
      section_label,
      title,
      image_primary,
      image_primary_alt,
      image_secondary,
      image_secondary_alt,
      description_one,
      description_two,
      experience_enabled,
      experience_value,
      experience_label,
      updated_at
    )
    VALUES (
      TRUE,
      ${content.about.sectionLabel},
      ${content.about.title},
      ${content.about.imagePrimary},
      ${content.about.imagePrimaryAlt},
      ${content.about.imageSecondary},
      ${content.about.imageSecondaryAlt},
      ${content.about.descriptionOne},
      ${content.about.descriptionTwo},
      ${content.about.experienceEnabled},
      ${content.about.experienceValue},
      ${content.about.experienceLabel},
      NOW()
    )
    ON CONFLICT (singleton_id)
    DO UPDATE SET
      section_label = EXCLUDED.section_label,
      title = EXCLUDED.title,
      image_primary = EXCLUDED.image_primary,
      image_primary_alt = EXCLUDED.image_primary_alt,
      image_secondary = EXCLUDED.image_secondary,
      image_secondary_alt = EXCLUDED.image_secondary_alt,
      description_one = EXCLUDED.description_one,
      description_two = EXCLUDED.description_two,
        experience_enabled = EXCLUDED.experience_enabled,
        experience_value = EXCLUDED.experience_value,
        experience_label = EXCLUDED.experience_label,
      updated_at = NOW();
  `;

  await sql`
    INSERT INTO services_content (
      singleton_id,
      section_label,
      title,
      description,
      updated_at
    )
    VALUES (
      TRUE,
      ${content.services.sectionLabel},
      ${content.services.title},
      ${content.services.description},
      NOW()
    )
    ON CONFLICT (singleton_id)
    DO UPDATE SET
      section_label = EXCLUDED.section_label,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      updated_at = NOW();
  `;

  await sql`DELETE FROM service_items;`;

  for (let i = 0; i < content.services.items.length; i += 1) {
    const item = content.services.items[i];
    await sql`
      INSERT INTO service_items (sort_order, title, description, icon, bullet_items, updated_at)
      VALUES (
        ${i},
        ${item.title},
        ${item.description},
        ${item.icon},
        ${JSON.stringify(item.items)}::jsonb,
        NOW()
      );
    `;
  }

  await sql`
    INSERT INTO gallery_content (singleton_id, section_label, title, description, updated_at)
    VALUES (
      TRUE,
      ${content.gallery.sectionLabel},
      ${content.gallery.title},
      ${content.gallery.description},
      NOW()
    )
    ON CONFLICT (singleton_id)
    DO UPDATE SET
      section_label = EXCLUDED.section_label,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      updated_at = NOW();
  `;

  await sql`DELETE FROM gallery_items;`;

  for (let i = 0; i < content.gallery.items.length; i += 1) {
    const item = content.gallery.items[i];
    await sql`
      INSERT INTO gallery_items (category, title, image, description, sort_order, updated_at)
      VALUES (
        ${item.category},
        ${item.title},
        ${item.image},
        ${item.description},
        ${i},
        NOW()
      );
    `;
  }

  await sql`
    INSERT INTO contact_content (
      singleton_id,
      section_label,
      title,
      description,
      email_label,
      email_primary,
      email_secondary,
      phone_label,
      phone_primary,
      phone_secondary,
      address_label,
      address,
      website_label,
      website,
      updated_at
    )
    VALUES (
      TRUE,
      ${content.contact.sectionLabel},
      ${content.contact.title},
      ${content.contact.description},
      ${content.contact.emailLabel},
      ${content.contact.emailPrimary},
      ${content.contact.emailSecondary},
      ${content.contact.phoneLabel},
      ${content.contact.phonePrimary},
      ${content.contact.phoneSecondary},
      ${content.contact.addressLabel},
      ${content.contact.address},
      ${content.contact.websiteLabel},
      ${content.contact.website},
      NOW()
    )
    ON CONFLICT (singleton_id)
    DO UPDATE SET
      section_label = EXCLUDED.section_label,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      email_label = EXCLUDED.email_label,
      email_primary = EXCLUDED.email_primary,
      email_secondary = EXCLUDED.email_secondary,
      phone_label = EXCLUDED.phone_label,
      phone_primary = EXCLUDED.phone_primary,
      phone_secondary = EXCLUDED.phone_secondary,
      address_label = EXCLUDED.address_label,
      address = EXCLUDED.address,
      website_label = EXCLUDED.website_label,
      website = EXCLUDED.website,
      updated_at = NOW();
  `;
}

function hasAnyContentValue(content) {
  const sections = [content.home, content.about, content.services, content.gallery, content.contact];
  for (const section of sections) {
    if (!section || typeof section !== 'object') {
      continue;
    }

    for (const value of Object.values(section)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return true;
      }

      if (typeof value === 'boolean' && value) {
        return true;
      }

      if (Array.isArray(value) && value.length > 0) {
        return true;
      }
    }
  }

  return false;
}

async function readFromNormalizedTables() {
  const [homeRows, aboutRows, servicesRows, serviceItemsRows, galleryRows, galleryItemsRows, contactRows] =
    await Promise.all([
      sql`SELECT * FROM home_content WHERE singleton_id = TRUE LIMIT 1;`,
      sql`SELECT * FROM about_content WHERE singleton_id = TRUE LIMIT 1;`,
      sql`SELECT * FROM services_content WHERE singleton_id = TRUE LIMIT 1;`,
      sql`SELECT * FROM service_items ORDER BY sort_order ASC, id ASC;`,
      sql`SELECT * FROM gallery_content WHERE singleton_id = TRUE LIMIT 1;`,
      sql`SELECT * FROM gallery_items ORDER BY sort_order ASC, id ASC;`,
      sql`SELECT * FROM contact_content WHERE singleton_id = TRUE LIMIT 1;`,
    ]);

  const home = homeRows[0];
  const about = aboutRows[0];
  const services = servicesRows[0];
  const gallery = galleryRows[0];
  const contact = contactRows[0];

  const fromTables = normalizeSiteContent({
    home: home
      ? {
          badge: home.badge ?? '',
          title: home.title ?? '',
          description: home.description ?? '',
          heroImage: home.hero_image ?? '',
          heroImageAlt: home.hero_image_alt ?? '',
          primaryCtaText: home.primary_cta_text ?? '',
          secondaryCtaText: home.secondary_cta_text ?? '',
        }
      : {},
    about: about
      ? {
          sectionLabel: about.section_label ?? '',
          title: about.title ?? '',
          imagePrimary: about.image_primary ?? '',
          imagePrimaryAlt: about.image_primary_alt ?? '',
          imageSecondary: about.image_secondary ?? '',
          imageSecondaryAlt: about.image_secondary_alt ?? '',
          descriptionOne: about.description_one ?? '',
          descriptionTwo: about.description_two ?? '',
          experienceEnabled: Boolean(about.experience_enabled),
          experienceValue: about.experience_value ?? '',
          experienceLabel: about.experience_label ?? '',
        }
      : {},
    services: services
      ? {
          sectionLabel: services.section_label ?? '',
          title: services.title ?? '',
          description: services.description ?? '',
          items: serviceItemsRows.map((item, index) => ({
            id: typeof item.id === 'number' ? item.id : index + 1,
            title: item.title ?? '',
            description: item.description ?? '',
            items: Array.isArray(item.bullet_items)
              ? item.bullet_items.filter((v) => typeof v === 'string')
              : [],
            icon: item.icon === 'ship' ? 'ship' : 'zap',
          })),
        }
      : {},
    gallery: gallery
      ? {
          sectionLabel: gallery.section_label ?? '',
          title: gallery.title ?? '',
          description: gallery.description ?? '',
          items: galleryItemsRows.map((item, index) => ({
            id: typeof item.id === 'number' ? item.id : index + 1,
            category: item.category ?? 'Lainnya',
            image: item.image ?? '',
            title: item.title ?? '',
            description: item.description ?? '',
          })),
        }
      : {},
    contact: contact
      ? {
          sectionLabel: contact.section_label ?? '',
          title: contact.title ?? '',
          description: contact.description ?? '',
          emailLabel: contact.email_label ?? '',
          emailPrimary: contact.email_primary ?? '',
          emailSecondary: contact.email_secondary ?? '',
          phoneLabel: contact.phone_label ?? '',
          phonePrimary: contact.phone_primary ?? '',
          phoneSecondary: contact.phone_secondary ?? '',
          addressLabel: contact.address_label ?? '',
          address: contact.address ?? '',
          websiteLabel: contact.website_label ?? '',
          website: contact.website ?? '',
        }
      : {},
  });

  return hasAnyContentValue(fromTables) ? fromTables : null;
}

async function readContent() {
  const cacheAge = Date.now() - lastKnownContentUpdatedAt;
  if (lastKnownContentUpdatedAt > 0 && cacheAge < READ_CACHE_TTL_MS) {
    return lastKnownContent;
  }

  return withDatabaseRetry(async () => {
    await ensureTable();

    const result = await sql`SELECT content FROM site_content WHERE id = ${CONTENT_KEY} LIMIT 1;`;
    if (result.length > 0 && isValidContent(result[0].content)) {
      const normalizedFromJson = normalizeSiteContent(result[0].content);
      if (hasAnyContentValue(normalizedFromJson)) {
        lastKnownContent = normalizedFromJson;
        lastKnownContentUpdatedAt = Date.now();
        return normalizedFromJson;
      }

      const fromTables = await readFromNormalizedTables();
      if (fromTables) {
        lastKnownContent = fromTables;
        lastKnownContentUpdatedAt = Date.now();
        return fromTables;
      }
      lastKnownContent = normalizedFromJson;
      lastKnownContentUpdatedAt = Date.now();
      return normalizedFromJson;
    }

    const fromTables = await readFromNormalizedTables();
    if (fromTables) {
      await sql`
        INSERT INTO site_content (id, content)
        VALUES (${CONTENT_KEY}, ${JSON.stringify(fromTables)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();
      `;
      lastKnownContent = fromTables;
      lastKnownContentUpdatedAt = Date.now();
      return fromTables;
    }

    const normalizedDefault = normalizeSiteContent(defaultContent);
    await sql`
      INSERT INTO site_content (id, content)
      VALUES (${CONTENT_KEY}, ${JSON.stringify(normalizedDefault)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();
    `;

    lastKnownContent = normalizedDefault;
    lastKnownContentUpdatedAt = Date.now();
    return normalizedDefault;
  }, DB_READ_MAX_RETRIES);
}

async function writeContent(content) {
  await withDatabaseRetry(async () => {
    await ensureTable();

    const normalized = normalizeSiteContent(content);
    await sql`
      INSERT INTO site_content (id, content)
      VALUES (${CONTENT_KEY}, ${JSON.stringify(normalized)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();
    `;

    await writeNormalizedTables(normalized);
    lastKnownContent = normalized;
    lastKnownContentUpdatedAt = Date.now();
  });
}

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const body = await parseRequestBody(req);

    if (req.method === 'GET') {
      const content = await readContent();
      return res.status(200).json({ content });
    }

    if (req.method === 'PUT') {
      const content = body?.content;
      const mode = body?.mode;

      if (mode === 'merge') {
        if (!isPartialContentPayload(content)) {
          return res.status(400).json({ message: 'Invalid partial content payload' });
        }

        const current = await readContent();
        const merged = mergeTopLevelContent(current, content);
        await writeContent(merged);
        return res.status(200).json({ message: 'Content merged and saved' });
      }

      if (!isValidContent(content)) {
        return res.status(400).json({ message: 'Invalid content payload' });
      }

      await writeContent(content);
      return res.status(200).json({ message: 'Content saved' });
    }

    if (req.method === 'POST') {
      const action = body?.action;
      if (action === 'reset') {
        const normalizedDefault = normalizeSiteContent(defaultContent);
        await writeContent(normalizedDefault);
        return res.status(200).json({ content: normalizedDefault });
      }
      return res.status(400).json({ message: 'Invalid action' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    if (req.method === 'GET' && isRetryableDatabaseError(error)) {
      return res.status(200).json({ content: lastKnownContent, stale: true });
    }

    const isTimeout = isRetryableDatabaseError(error);
    return res.status(500).json({
      message: 'Database error',
      detail:
        error instanceof Error
          ? isTimeout
            ? `${error.message} (Neon timeout: coba ulang 3-10 detik atau pastikan region/allowlist jaringan)`
            : error.message
          : 'Unknown error',
    });
  }
}
