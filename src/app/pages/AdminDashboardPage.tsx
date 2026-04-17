import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { AppLogo } from '../components/branding/AppLogo';
import type { GalleryItem, ServiceIcon, ServiceItem, SiteContent } from '../types/site-content';
import type { SaveResult } from '../data/content-storage';

type AdminDashboardPageProps = {
  content: SiteContent;
  onSave: (next: SiteContent) => Promise<SaveResult>;
  onReset: () => Promise<SaveResult>;
  onLogout: () => void;
};

type AdminFeature = 'home' | 'about' | 'services' | 'gallery' | 'contact';

const featureTabs: Array<{ id: AdminFeature; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'contact', label: 'Contact Us' },
];

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 1600;
const IMAGE_OUTPUT_QUALITY = 0.78;
const MAX_DATA_URL_SIZE_KB = 700;
const SERVICE_BULLET_LIMIT = 4;
const TRUST_INDICATOR_LIMIT = 4;
const SERVICE_ICON_OPTIONS: Array<{ value: ServiceIcon; label: string }> = [
  { value: 'zap', label: 'Petir (Energi dan Kelistrikan)' },
  { value: 'ship', label: 'Kapal (Ekspor Impor)' },
  { value: 'fish', label: 'Ikan (Perikanan dan Kelautan)' },
  { value: 'truck', label: 'Truk (Logistik Darat)' },
  { value: 'package', label: 'Paket (Distribusi Barang)' },
  { value: 'briefcase', label: 'Tas Kerja (Jasa Korporat)' },
  { value: 'building', label: 'Gedung (Proyek dan Infrastruktur)' },
  { value: 'handshake', label: 'Jabat Tangan (Kemitraan)' },
  { value: 'shield', label: 'Perisai (Keamanan dan Kepatuhan)' },
];
const SERVICE_ICON_VALUES: ServiceIcon[] = SERVICE_ICON_OPTIONS.map((option) => option.value);
const DEFAULT_SERVICE_ICON: ServiceIcon = SERVICE_ICON_VALUES[0] ?? 'zap';

function isServiceIcon(value: string): value is ServiceIcon {
  return SERVICE_ICON_VALUES.includes(value as ServiceIcon);
}

function getServiceIconByIndex(index: number): ServiceIcon {
  return SERVICE_ICON_VALUES[index % SERVICE_ICON_VALUES.length] ?? DEFAULT_SERVICE_ICON;
}

function buildServiceBulletSlots(items: string[]): string[] {
  return Array.from({ length: SERVICE_BULLET_LIMIT }, (_, index) => items[index] ?? '');
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Gagal membaca gambar.'));
      img.src = String(reader.result ?? '');
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

function computeScaledSize(width: number, height: number) {
  const scale = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  const size = computeScaledSize(img.width, img.height);

  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas tidak tersedia untuk kompresi gambar.');
  }

  ctx.drawImage(img, 0, 0, size.width, size.height);
  const compressed = canvas.toDataURL('image/jpeg', IMAGE_OUTPUT_QUALITY);
  return compressed;
}

export function AdminDashboardPage({ content, onSave, onReset, onLogout }: AdminDashboardPageProps) {
  const [draft, setDraft] = useState<SiteContent>(content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFeature, setActiveFeature] = useState<AdminFeature>('home');
  const [uploadError, setUploadError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isAddGalleryModalOpen, setIsAddGalleryModalOpen] = useState(false);
  const [activeGalleryItemId, setActiveGalleryItemId] = useState<number | null>(null);
  const [galleryModalError, setGalleryModalError] = useState('');
  const [newGalleryItem, setNewGalleryItem] = useState<Omit<GalleryItem, 'id'>>({
    category: 'Export Import',
    title: '',
    image: '/assets/branding/logo-jip.png',
    description: '',
  });

  useEffect(() => {
    setDraft(content);
  }, [content]);

  useEffect(() => {
    if (activeFeature !== 'gallery') {
      setIsAddGalleryModalOpen(false);
      setActiveGalleryItemId(null);
      setGalleryModalError('');
    }
  }, [activeFeature]);

  const totalGallery = useMemo(() => draft.gallery.items.length, [draft.gallery.items.length]);
  const activeGalleryItem = useMemo(
    () => draft.gallery.items.find((item) => item.id === activeGalleryItemId) ?? null,
    [activeGalleryItemId, draft.gallery.items],
  );

  const activeFeatureLabel = useMemo(
    () => featureTabs.find((tab) => tab.id === activeFeature)?.label ?? 'Home',
    [activeFeature],
  );

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    onSuccess: (value: string) => void,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('File yang diupload harus berupa gambar.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setUploadError(`Ukuran maksimal file gambar adalah ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);

      const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
      if (sizeKb > MAX_DATA_URL_SIZE_KB) {
        setUploadError(
          `Gambar terlalu besar (${sizeKb}KB). Coba gambar lain atau resolusi lebih kecil (maks ${MAX_DATA_URL_SIZE_KB}KB).`,
        );
        return;
      }

      onSuccess(dataUrl);
    } catch {
      setUploadError('Gagal upload gambar. Coba ulangi.');
    }
  };

  const renderImageSourceField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-[var(--navy)]">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Masukkan URL gambar"
        className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
      />
      <div className="flex flex-wrap gap-2">
        <label className="px-3 py-2 rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--gold)] transition-colors cursor-pointer text-sm">
          Upload Gambar
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleImageUpload(event, onChange);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => onChange('')}
          className="px-3 py-2 rounded-lg border border-[var(--navy)]/20 text-[var(--navy)] text-sm"
        >
          Hapus Gambar
        </button>
      </div>
      {value ? (
        <img
          src={value}
          alt={label}
          className="w-full h-36 object-cover rounded-lg border border-[var(--navy)]/10 bg-white"
        />
      ) : null}
    </div>
  );

  const updateGallery = (id: number, field: keyof GalleryItem, value: string) => {
    setDraft((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        items: prev.gallery.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      },
    }));
  };

  const buildDraftWithAddedGalleryItem = (base: SiteContent, itemDraft: Omit<GalleryItem, 'id'>) => {
    const nextId = Math.max(0, ...base.gallery.items.map((item) => item.id)) + 1;
    return {
      ...base,
      gallery: {
        ...base.gallery,
        items: [
          ...base.gallery.items,
          {
            id: nextId,
            category: itemDraft.category.trim() || 'Lainnya',
            title: itemDraft.title.trim() || 'Kegiatan Baru',
            image: itemDraft.image.trim() || '/assets/branding/logo-jip.png',
            description: itemDraft.description.trim() || 'Isi deskripsi kegiatan di sini.',
          },
        ],
      },
    };
  };

  const buildDraftWithRemovedGalleryItem = (base: SiteContent, id: number) => {
    return {
      ...base,
      gallery: {
        ...base.gallery,
        items: base.gallery.items.filter((item) => item.id !== id),
      },
    };
  };

  const buildDraftWithAddedServiceItem = (base: SiteContent) => {
    const nextId = Math.max(0, ...base.services.items.map((item) => item.id)) + 1;
    const nextService: ServiceItem = {
      id: nextId,
      title: '',
      description: '',
      items: [],
      icon: getServiceIconByIndex(base.services.items.length),
    };

    return {
      ...base,
      services: {
        ...base.services,
        items: [...base.services.items, nextService],
      },
    };
  };

  const buildDraftWithRemovedServiceItem = (base: SiteContent, id: number) => {
    return {
      ...base,
      services: {
        ...base.services,
        items: base.services.items.filter((item) => item.id !== id),
      },
    };
  };

  const saveDraftNow = async (nextDraft?: SiteContent): Promise<SaveResult> => {
    const payload = nextDraft ?? draft;
    setIsSubmitting(true);
    setSaveStatus('idle');
    setSaveMessage('');
    try {
      const result = await onSave(payload);
      setSaveStatus(result.ok ? 'success' : 'error');
      setSaveMessage(result.message);
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddGalleryModal = () => {
    setGalleryModalError('');
    setNewGalleryItem({
      category: 'Export Import',
      title: '',
      image: '/assets/branding/logo-jip.png',
      description: '',
    });
    setIsAddGalleryModalOpen(true);
  };

  const handleCreateGalleryItem = async () => {
    if (!newGalleryItem.title.trim()) {
      setGalleryModalError('Judul kegiatan wajib diisi.');
      return;
    }

    const nextDraft = buildDraftWithAddedGalleryItem(draft, newGalleryItem);
    setDraft(nextDraft);

    const result = await saveDraftNow(nextDraft);
    if (result.ok) {
      setIsAddGalleryModalOpen(false);
      setGalleryModalError('');
      return;
    }

    setGalleryModalError(result.message);
  };

  const updateService = (id: number, field: 'title' | 'description' | 'icon', value: string) => {
    setDraft((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        items: prev.services.items.map((service) =>
          service.id === id
            ? {
                ...service,
                [field]: field === 'icon' ? (isServiceIcon(value) ? value : DEFAULT_SERVICE_ICON) : value,
              }
            : service,
        ),
      },
    }));
  };

  const updateServiceItem = (id: number, itemIndex: number, value: string) => {
    setDraft((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        items: prev.services.items.map((service) => {
          if (service.id !== id) {
            return service;
          }

          const nextItems = buildServiceBulletSlots(service.items);
          nextItems[itemIndex] = value;

          return {
            ...service,
            items: nextItems,
          };
        }),
      },
    }));
  };

  const updateTrustIndicator = (
    indicatorIndex: number,
    field: 'value' | 'label',
    value: string,
  ) => {
    setDraft((prev) => {
      const nextIndicators = Array.from({ length: TRUST_INDICATOR_LIMIT }, (_, index) => ({
        value: prev.about.trustIndicators[index]?.value ?? '',
        label: prev.about.trustIndicators[index]?.label ?? '',
      }));

      nextIndicators[indicatorIndex] = {
        ...nextIndicators[indicatorIndex],
        [field]: value,
      };

      return {
        ...prev,
        about: {
          ...prev.about,
          trustIndicators: nextIndicators,
        },
      };
    });
  };

  const handleSave = async () => {
    await saveDraftNow();
  };

  const handleReset = async () => {
    setIsSubmitting(true);
    setSaveStatus('idle');
    setSaveMessage('');
    try {
      const result = await onReset();
      setSaveStatus(result.ok ? 'success' : 'error');
      setSaveMessage(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <header className="bg-white border-b border-[var(--navy)]/10 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-[var(--navy)]/10">
                <AppLogo className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-[var(--navy)] font-bold">Admin Panel PT JIP</p>
                <p className="text-xs text-[var(--dark-text)]/60">Fitur aktif: {activeFeatureLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/"
                className="px-4 py-2 rounded-lg border border-[var(--navy)]/20 text-[var(--navy)] hover:bg-[var(--navy)]/5 transition-colors"
              >
                Lihat Website
              </a>
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--gold)] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {featureTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFeature(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFeature === tab.id
                    ? 'bg-[var(--navy)] text-white'
                    : 'bg-[var(--cream)] text-[var(--navy)] hover:bg-[var(--navy)]/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {uploadError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {uploadError}
            </div>
          ) : null}

          {saveMessage ? (
            <div
              className={`rounded-lg px-4 py-3 text-sm border ${
                saveStatus === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {saveMessage}
            </div>
          ) : null}

            {activeFeature === 'home' && (
              <section className="bg-white rounded-2xl shadow-sm border border-[var(--navy)]/10 p-6">
                <h2 className="text-2xl font-bold text-[var(--navy)]">Home Section</h2>
                <div className="grid md:grid-cols-2 gap-4 mt-5">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Badge</label>
                    <input value={draft.home.badge} onChange={(e) => setDraft((prev) => ({ ...prev, home: { ...prev.home, badge: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Judul Home</label>
                    <input value={draft.home.title} onChange={(e) => setDraft((prev) => ({ ...prev, home: { ...prev.home, title: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Deskripsi Home</label>
                  <textarea rows={4} value={draft.home.description} onChange={(e) => setDraft((prev) => ({ ...prev, home: { ...prev.home, description: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    {renderImageSourceField('Gambar Home', draft.home.heroImage, (value) =>
                      setDraft((prev) => ({ ...prev, home: { ...prev.home, heroImage: value } })),
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Alt Gambar Home</label>
                    <input value={draft.home.heroImageAlt} onChange={(e) => setDraft((prev) => ({ ...prev, home: { ...prev.home, heroImageAlt: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-[var(--navy)]/10 bg-[var(--cream)] px-4 py-3 text-sm text-[var(--dark-text)]/80">
                  Tombol Home ditetapkan tetap untuk navigasi utama:
                  <span className="font-semibold text-[var(--navy)]"> Hubungi Kami </span>
                  (ke Contact) dan
                  <span className="font-semibold text-[var(--navy)]"> Lihat Gallery </span>
                  (ke Gallery).
                </div>
              </section>
            )}

            {activeFeature === 'about' && (
              <section className="bg-white rounded-2xl shadow-sm border border-[var(--navy)]/10 p-6">
                <h2 className="text-2xl font-bold text-[var(--navy)]">About Section</h2>
                <div className="grid md:grid-cols-2 gap-4 mt-5">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Label Section</label>
                    <input value={draft.about.sectionLabel} onChange={(e) => setDraft((prev) => ({ ...prev, about: { ...prev.about, sectionLabel: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Judul Section</label>
                    <input value={draft.about.title} onChange={(e) => setDraft((prev) => ({ ...prev, about: { ...prev.about, title: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    {renderImageSourceField('Gambar 1', draft.about.imagePrimary, (value) =>
                      setDraft((prev) => ({ ...prev, about: { ...prev.about, imagePrimary: value } })),
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Alt Gambar 1</label>
                    <input value={draft.about.imagePrimaryAlt} onChange={(e) => setDraft((prev) => ({ ...prev, about: { ...prev.about, imagePrimaryAlt: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    {renderImageSourceField('Gambar 2', draft.about.imageSecondary, (value) =>
                      setDraft((prev) => ({ ...prev, about: { ...prev.about, imageSecondary: value } })),
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Alt Gambar 2</label>
                    <input value={draft.about.imageSecondaryAlt} onChange={(e) => setDraft((prev) => ({ ...prev, about: { ...prev.about, imageSecondaryAlt: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Deskripsi 1</label>
                  <textarea rows={4} value={draft.about.descriptionOne} onChange={(e) => setDraft((prev) => ({ ...prev, about: { ...prev.about, descriptionOne: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Deskripsi 2</label>
                  <textarea rows={4} value={draft.about.descriptionTwo} onChange={(e) => setDraft((prev) => ({ ...prev, about: { ...prev.about, descriptionTwo: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                </div>
                <div className="mt-5 rounded-xl border border-[var(--navy)]/15 bg-[var(--cream)]/50 p-4 space-y-3">
                  <label className="flex items-center gap-3 text-sm font-semibold text-[var(--navy)]">
                    <input
                      type="checkbox"
                      checked={draft.about.experienceEnabled}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          about: { ...prev.about, experienceEnabled: e.target.checked },
                        }))
                      }
                      className="w-4 h-4"
                    />
                    Tampilkan Card Experience di Landing Page
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Nilai Experience</label>
                      <input
                        value={draft.about.experienceValue}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, about: { ...prev.about, experienceValue: e.target.value } }))
                        }
                        placeholder="Contoh: 15+"
                        className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                        disabled={!draft.about.experienceEnabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Label Experience</label>
                      <input
                        value={draft.about.experienceLabel}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, about: { ...prev.about, experienceLabel: e.target.value } }))
                        }
                        placeholder="Contoh: Years Experience"
                        className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                        disabled={!draft.about.experienceEnabled}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-[var(--navy)]/15 bg-[var(--cream)]/50 p-4 space-y-3">
                  <label className="flex items-center gap-3 text-sm font-semibold text-[var(--navy)]">
                    <input
                      type="checkbox"
                      checked={draft.about.trustIndicatorsEnabled}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          about: {
                            ...prev.about,
                            trustIndicatorsEnabled: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4"
                    />
                    Tampilkan Trust Indicators (Statistik Biru) di Landing Page
                  </label>

                  <div className="grid md:grid-cols-2 gap-4">
                    {Array.from({ length: TRUST_INDICATOR_LIMIT }, (_, index) => {
                      const indicator = draft.about.trustIndicators[index] ?? { value: '', label: '' };

                      return (
                        <div
                          key={`trust-indicator-${index}`}
                          className="rounded-lg border border-[var(--navy)]/10 bg-white p-3 space-y-3"
                        >
                          <p className="text-xs font-semibold text-[var(--dark-text)]/60">Statistik #{index + 1}</p>
                          <div>
                            <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Nilai</label>
                            <input
                              value={indicator.value}
                              onChange={(e) => updateTrustIndicator(index, 'value', e.target.value)}
                              placeholder="Contoh: 15+"
                              className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                              disabled={!draft.about.trustIndicatorsEnabled}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Label</label>
                            <input
                              value={indicator.label}
                              onChange={(e) => updateTrustIndicator(index, 'label', e.target.value)}
                              placeholder="Contoh: Years Experience"
                              className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                              disabled={!draft.about.trustIndicatorsEnabled}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {activeFeature === 'services' && (
              <section className="bg-white rounded-2xl shadow-sm border border-[var(--navy)]/10 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--navy)]">Services Section</h2>
                    <p className="text-xs text-[var(--dark-text)]/60 mt-1">
                      Bebas tambah layanan sesuai kebutuhan bisnis, tidak dibatasi kategori tertentu.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => buildDraftWithAddedServiceItem(prev))}
                    className="px-4 py-2 rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--gold)] transition-colors"
                  >
                    Tambah Service
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-5">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Label Section</label>
                    <input value={draft.services.sectionLabel} onChange={(e) => setDraft((prev) => ({ ...prev, services: { ...prev.services, sectionLabel: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Judul Section</label>
                    <input value={draft.services.title} onChange={(e) => setDraft((prev) => ({ ...prev, services: { ...prev.services, title: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Deskripsi Section</label>
                  <textarea rows={3} value={draft.services.description} onChange={(e) => setDraft((prev) => ({ ...prev, services: { ...prev.services, description: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-5">
                  {draft.services.items.map((service, index) => (
                    <div key={service.id} className="p-4 rounded-xl border border-[var(--navy)]/15 bg-[var(--cream)]/50 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[var(--dark-text)]/60">Service #{index + 1}</p>
                        <button
                          type="button"
                          onClick={() => setDraft((prev) => buildDraftWithRemovedServiceItem(prev, service.id))}
                          className="px-2.5 py-1 rounded-md border border-red-300 text-red-600 text-xs hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Ikon Layanan</label>
                        <select value={service.icon} onChange={(e) => updateService(service.id, 'icon', e.target.value)} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg bg-white">
                          {SERVICE_ICON_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Judul</label>
                        <input value={service.title} onChange={(e) => updateService(service.id, 'title', e.target.value)} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Deskripsi</label>
                        <textarea rows={4} value={service.description} onChange={(e) => updateService(service.id, 'description', e.target.value)} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Poin Layanan (maksimal 4)</label>
                        <div className="space-y-2">
                          {buildServiceBulletSlots(service.items).map((point, itemIndex) => (
                            <input
                              key={`${service.id}-item-${itemIndex}`}
                              value={point}
                              onChange={(event) => updateServiceItem(service.id, itemIndex, event.target.value)}
                              className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                              placeholder={`Poin layanan ${itemIndex + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {draft.services.items.length === 0 ? (
                  <div className="mt-5 rounded-lg border border-dashed border-[var(--navy)]/25 px-4 py-5 text-sm text-[var(--dark-text)]/70">
                    Belum ada kartu service. Klik tombol Tambah Service untuk mulai.
                  </div>
                ) : null}
              </section>
            )}

            {activeFeature === 'gallery' && (
              <section className="bg-white rounded-2xl shadow-sm border border-[var(--navy)]/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--navy)]">Gallery Section</h2>
                    <p className="text-xs text-[var(--dark-text)]/60 mt-1">Total kegiatan: {totalGallery}</p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddGalleryModal}
                    className="px-4 py-2 rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--gold)] transition-colors"
                  >
                    Tambah Kegiatan
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Label Section</label>
                    <input value={draft.gallery.sectionLabel} onChange={(e) => setDraft((prev) => ({ ...prev, gallery: { ...prev.gallery, sectionLabel: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Judul Section</label>
                    <input value={draft.gallery.title} onChange={(e) => setDraft((prev) => ({ ...prev, gallery: { ...prev.gallery, title: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Deskripsi Section</label>
                  <textarea rows={3} value={draft.gallery.description} onChange={(e) => setDraft((prev) => ({ ...prev, gallery: { ...prev.gallery, description: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                  {draft.gallery.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-[var(--navy)]/15 bg-[var(--cream)]/50 overflow-hidden"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-40 object-cover border-b border-[var(--navy)]/10 bg-white"
                      />
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] font-medium">
                            {item.category || 'Lainnya'}
                          </span>
                          <span className="text-xs text-[var(--dark-text)]/60">#{item.id}</span>
                        </div>
                        <h3 className="text-base font-semibold text-[var(--navy)] leading-snug">{item.title}</h3>
                        <p className="text-sm text-[var(--dark-text)]/75 line-clamp-3">{item.description}</p>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveGalleryItemId(item.id)}
                            className="px-3 py-2 rounded-lg bg-[var(--navy)] text-white text-sm hover:bg-[var(--gold)] transition-colors"
                          >
                            Lihat Detail
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const nextDraft = buildDraftWithRemovedGalleryItem(draft, item.id);
                              setDraft(nextDraft);
                              await saveDraftNow(nextDraft);
                            }}
                            className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeFeature === 'contact' && (
              <section className="bg-white rounded-2xl shadow-sm border border-[var(--navy)]/10 p-6">
                <h2 className="text-2xl font-bold text-[var(--navy)]">Contact Section</h2>
                <div className="grid md:grid-cols-2 gap-4 mt-5">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Label Section</label>
                    <input value={draft.contact.sectionLabel} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, sectionLabel: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Judul Section</label>
                    <input value={draft.contact.title} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, title: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Deskripsi</label>
                  <textarea rows={3} value={draft.contact.description} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, description: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Label Email</label>
                    <input value={draft.contact.emailLabel} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, emailLabel: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Email Utama</label>
                    <input value={draft.contact.emailPrimary} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, emailPrimary: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Email Kedua</label>
                  <input value={draft.contact.emailSecondary} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, emailSecondary: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Label Telepon</label>
                    <input value={draft.contact.phoneLabel} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, phoneLabel: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Telepon Utama</label>
                    <input value={draft.contact.phonePrimary} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, phonePrimary: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Telepon Kedua</label>
                  <input value={draft.contact.phoneSecondary} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, phoneSecondary: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Label Alamat</label>
                    <input value={draft.contact.addressLabel} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, addressLabel: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Alamat</label>
                    <input value={draft.contact.address} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, address: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Label Website</label>
                    <input value={draft.contact.websiteLabel} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, websiteLabel: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Website</label>
                    <input value={draft.contact.website} onChange={(e) => setDraft((prev) => ({ ...prev, contact: { ...prev.contact, website: e.target.value } }))} className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg" />
                  </div>
                </div>
              </section>
            )}

            <section className="pb-10 space-y-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-5 py-3 rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--gold)] transition-colors font-semibold disabled:opacity-60"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="px-5 py-3 rounded-lg border border-[var(--navy)]/20 text-[var(--navy)] hover:bg-[var(--navy)]/5 transition-colors disabled:opacity-60"
                >
                  Reset ke Default
                </button>
              </div>

              {saveMessage ? (
                <div
                  className={`rounded-lg px-4 py-3 text-sm border ${
                    saveStatus === 'success'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {saveMessage}
                </div>
              ) : null}
            </section>

          {isAddGalleryModalOpen ? (
            <div className="fixed inset-0 z-40 bg-[var(--navy)]/45 backdrop-blur-[1px] px-4 py-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[var(--navy)]/10 shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-[var(--navy)]">Tambah Kegiatan Gallery</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddGalleryModalOpen(false);
                      setGalleryModalError('');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[var(--navy)]/20 text-[var(--navy)]"
                  >
                    Tutup
                  </button>
                </div>

                {galleryModalError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
                    {galleryModalError}
                  </div>
                ) : null}

                <div>
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Kategori</label>
                  <input
                    value={newGalleryItem.category}
                    onChange={(event) =>
                      setNewGalleryItem((prev) => ({ ...prev, category: event.target.value }))
                    }
                    className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                    placeholder="Contoh: PLN atau Export Import"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Judul</label>
                  <input
                    value={newGalleryItem.title}
                    onChange={(event) =>
                      setNewGalleryItem((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                  />
                </div>

                {renderImageSourceField('Foto Kegiatan', newGalleryItem.image, (value) =>
                  setNewGalleryItem((prev) => ({ ...prev, image: value })),
                )}

                <div>
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Deskripsi</label>
                  <textarea
                    rows={4}
                    value={newGalleryItem.description}
                    onChange={(event) =>
                      setNewGalleryItem((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddGalleryModalOpen(false);
                      setGalleryModalError('');
                    }}
                    className="px-4 py-2 rounded-lg border border-[var(--navy)]/20 text-[var(--navy)]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCreateGalleryItem();
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--gold)] transition-colors"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Tambahkan & Simpan'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeGalleryItem ? (
            <div className="fixed inset-0 z-40 bg-[var(--navy)]/45 backdrop-blur-[1px] px-4 py-6 overflow-y-auto">
              <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[var(--navy)]/10 shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--dark-text)]/60">Detail Kegiatan #{activeGalleryItem.id}</p>
                    <h3 className="text-xl font-bold text-[var(--navy)]">Edit Detail Gallery</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveGalleryItemId(null)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--navy)]/20 text-[var(--navy)]"
                  >
                    Tutup
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Kategori</label>
                    <input
                      value={activeGalleryItem.category}
                      onChange={(event) => updateGallery(activeGalleryItem.id, 'category', event.target.value)}
                      className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Judul</label>
                    <input
                      value={activeGalleryItem.title}
                      onChange={(event) => updateGallery(activeGalleryItem.id, 'title', event.target.value)}
                      className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                    />
                  </div>
                </div>

                {renderImageSourceField('Foto Kegiatan', activeGalleryItem.image, (value) =>
                  updateGallery(activeGalleryItem.id, 'image', value),
                )}

                <div>
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1">Deskripsi</label>
                  <textarea
                    rows={5}
                    value={activeGalleryItem.description}
                    onChange={(event) => updateGallery(activeGalleryItem.id, 'description', event.target.value)}
                    className="w-full px-3 py-2 border border-[var(--navy)]/20 rounded-lg"
                  />
                </div>

                <div className="flex justify-between pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      const nextDraft = buildDraftWithRemovedGalleryItem(draft, activeGalleryItem.id);
                      setDraft(nextDraft);
                      const result = await saveDraftNow(nextDraft);
                      if (!result.ok) {
                        return;
                      }
                      setActiveGalleryItemId(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Hapus Kegiatan
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await saveDraftNow();
                      if (!result.ok) {
                        return;
                      }
                      setActiveGalleryItemId(null);
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-[var(--navy)] text-white hover:bg-[var(--gold)] transition-colors"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Detail'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
