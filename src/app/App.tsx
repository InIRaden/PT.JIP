import { useMemo, useState } from 'react';
import { ImageWithFallback } from './components/shared/ImageWithFallback';
import { AppLogo } from './components/branding/AppLogo';
import { Menu, X, Ship, Zap, CheckCircle, Mail, Phone, MapPin, Globe } from 'lucide-react';
import type { ServiceIcon, SiteContent } from './types/site-content';

type AppProps = {
  content: SiteContent;
};

export default function App({ content }: AppProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState('Semua');
  const [gallerySearch, setGallerySearch] = useState('');

  const home = content.home;
  const homePrimaryCtaText = home.primaryCtaText?.trim() || 'Hubungi Kami';
  const homeSecondaryCtaText = home.secondaryCtaText?.trim() || 'Lihat Gallery';
  const about = content.about;
  const servicesSection = content.services;
  const services = servicesSection.items;
  const gallerySection = content.gallery;
  const galleryItems = gallerySection.items;
  const contact = content.contact;

  const trustIndicators = useMemo(() => {
    const fallback = [
      { value: '15+', label: 'Years Experience' },
      { value: '500+', label: 'Projects Completed' },
      { value: '15+', label: 'Export Countries' },
      { value: '100%', label: 'Client Satisfaction' },
    ];
    const source = Array.isArray(about.trustIndicators) ? about.trustIndicators : [];

    return Array.from({ length: 4 }, (_, index) => {
      const current = source[index];
      return {
        value: current?.value?.trim() || fallback[index].value,
        label: current?.label?.trim() || fallback[index].label,
      };
    });
  }, [about.trustIndicators]);

  const galleryCategories = useMemo(() => {
    const unique = Array.from(
      new Set(galleryItems.map((item) => item.category?.trim() || 'Lainnya')),
    );
    return ['Semua', ...unique];
  }, [galleryItems]);

  const filteredGalleryItems = useMemo(() => {
    const search = gallerySearch.trim().toLowerCase();

    return galleryItems.filter((item) => {
      const category = item.category?.trim() || 'Lainnya';
      const matchCategory = selectedGalleryCategory === 'Semua' || category === selectedGalleryCategory;

      if (!matchCategory) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = `${item.title} ${item.description} ${category}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [galleryItems, gallerySearch, selectedGalleryCategory]);

  const visibleServices = useMemo(() => {
    return services.filter((service) => {
      const hasTitle = service.title.trim().length > 0;
      const hasDescription = service.description.trim().length > 0;
      const hasItems = service.items.some((item) => item.trim().length > 0);
      return hasTitle || hasDescription || hasItems;
    });
  }, [services]);

  const renderServiceIcon = (icon: ServiceIcon, isFirst: boolean) => {
    if (icon === 'zap') {
      return <Zap className={`w-5 h-5 ${isFirst ? 'text-[var(--gold)]' : 'text-white'}`} />;
    }
    return <Ship className={`w-5 h-5 ${isFirst ? 'text-[var(--gold)]' : 'text-white'}`} />;
  };

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-[var(--navy)]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-[var(--navy)]/10">
                <AppLogo className="h-full w-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--navy)] tracking-tight">PT Jayeng Inti Pratama</h1>
                <p className="text-xs text-[var(--navy)]/60">Excellence in Export & Energy</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-[var(--navy)] hover:text-[var(--gold)] transition-colors duration-300">Home</a>
              <a href="#about" className="text-[var(--navy)] hover:text-[var(--gold)] transition-colors duration-300">About</a>
              <a href="#services" className="text-[var(--navy)] hover:text-[var(--gold)] transition-colors duration-300">Services</a>
              <a href="#gallery" className="text-[var(--navy)] hover:text-[var(--gold)] transition-colors duration-300">Gallery</a>
              <a href="#contact" className="bg-[var(--navy)] text-white px-6 py-2.5 rounded-md hover:bg-[var(--gold)] transition-all duration-300">Contact Us</a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-[var(--navy)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[var(--navy)]/10 animate-in slide-in-from-top duration-300">
            <div className="px-4 py-4 space-y-3">
              <a href="#home" className="block text-[var(--navy)] hover:text-[var(--gold)] py-2">Home</a>
              <a href="#about" className="block text-[var(--navy)] hover:text-[var(--gold)] py-2">About</a>
              <a href="#services" className="block text-[var(--navy)] hover:text-[var(--gold)] py-2">Services</a>
              <a href="#gallery" className="block text-[var(--navy)] hover:text-[var(--gold)] py-2">Gallery</a>
              <a href="#contact" className="block bg-[var(--navy)] text-white px-6 py-2.5 rounded-md text-center hover:bg-[var(--gold)] transition-all">Contact Us</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[var(--ocean-blue)] to-[var(--light-blue)] opacity-[0.02]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
              <div className="inline-block">
                <span className="text-[var(--gold)] tracking-[0.3em] uppercase text-sm font-semibold">{home.badge}</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-[var(--navy)] leading-tight">
                {home.title}
              </h1>
              <p className="text-lg text-[var(--dark-text)]/70 leading-relaxed max-w-xl">
                {home.description}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <a href="#contact" className="bg-[var(--navy)] text-white px-8 py-4 rounded-lg hover:bg-[var(--gold)] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                  {homePrimaryCtaText}
                </a>
                <a href="#gallery" className="border-2 border-[var(--navy)] text-[var(--navy)] px-8 py-4 rounded-lg hover:bg-[var(--navy)] hover:text-white transition-all duration-300">
                  {homeSecondaryCtaText}
                </a>
              </div>
            </div>
            <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-300">
              <div className="absolute -inset-4 bg-gradient-to-br from-[var(--gold)]/20 to-[var(--light-blue)]/20 rounded-2xl blur-2xl"></div>
              <ImageWithFallback
                src={home.heroImage}
                alt={home.heroImageAlt}
                className="relative rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 md:order-1">
              <div className="grid grid-cols-2 gap-4">
                <ImageWithFallback
                  src={about.imagePrimary}
                  alt={about.imagePrimaryAlt}
                  className="rounded-lg shadow-lg h-64 object-cover"
                />
                <ImageWithFallback
                  src={about.imageSecondary}
                  alt={about.imageSecondaryAlt}
                  className="rounded-lg shadow-lg h-64 object-cover mt-8"
                />
              </div>
              {about.experienceEnabled ? (
                <div className="absolute -bottom-6 -right-6 bg-[var(--gold)] text-white p-8 rounded-lg shadow-xl">
                  <p className="text-4xl font-bold">{about.experienceValue || '-'}</p>
                  <p className="text-sm">{about.experienceLabel || 'Experience'}</p>
                </div>
              ) : null}
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <span className="text-[var(--gold)] tracking-[0.3em] uppercase text-sm font-semibold">{about.sectionLabel}</span>
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--navy)] leading-tight">
                {about.title}
              </h2>
              <p className="text-[var(--dark-text)]/70 leading-relaxed">
                {about.descriptionOne}
              </p>
              <p className="text-[var(--dark-text)]/70 leading-relaxed">
                {about.descriptionTwo}
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-[var(--gold)]" />
                  <h4 className="font-semibold text-[var(--navy)]">Certified Quality</h4>
                  <p className="text-sm text-[var(--dark-text)]/60">Standar internasional HACCP & ISO</p>
                </div>
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-[var(--gold)]" />
                  <h4 className="font-semibold text-[var(--navy)]">Global Network</h4>
                  <p className="text-sm text-[var(--dark-text)]/60">Mitra di 15+ negara</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 md:py-32 bg-[var(--cream)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[var(--gold)] tracking-[0.28em] uppercase text-xs md:text-sm font-semibold">{servicesSection.sectionLabel}</span>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--navy)] mt-4 mb-6">
              {servicesSection.title}
            </h2>
            <p className="text-[var(--dark-text)]/70 max-w-3xl mx-auto leading-relaxed">
              {servicesSection.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {visibleServices.map((service, index) => {
              const isPrimaryTone = index % 2 === 0;
              const accent = isPrimaryTone ? 'var(--gold)' : 'var(--light-blue)';
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl p-7 md:p-8 border border-[var(--navy)]/10 shadow-[0_16px_38px_-22px_rgba(12,31,66,0.45)] hover:shadow-[0_22px_45px_-22px_rgba(12,31,66,0.55)] transition-shadow duration-300 min-h-[420px]"
                  style={{ borderTop: `2px solid ${accent}` }}
                >
                  <div
                    className="w-11 h-11 bg-gradient-to-br rounded-xl flex items-center justify-center mb-5"
                    style={{
                      backgroundImage: isPrimaryTone
                        ? 'linear-gradient(to bottom right, var(--navy), var(--ocean-blue))'
                        : 'linear-gradient(to bottom right, var(--light-blue), var(--ocean-blue))',
                    }}
                  >
                    {renderServiceIcon(service.icon, isPrimaryTone)}
                  </div>
                  <h3 className="text-[1.9rem] leading-tight font-bold text-[var(--navy)] mb-4">{service.title}</h3>
                  <p className="text-[var(--dark-text)]/70 mb-6 leading-7 text-[15px]">{service.description}</p>
                  <ul className="space-y-2.5">
                    {service.items
                      .map((itemText) => itemText.trim())
                      .filter((itemText) => itemText.length > 0)
                      .slice(0, 4)
                      .map((itemText) => (
                      <li key={`${service.id}-${itemText}`} className="flex items-start">
                        <CheckCircle
                          className="w-4 h-4 mr-3 mt-1 flex-shrink-0"
                          style={{ color: accent }}
                        />
                        <span className="text-[var(--dark-text)]/80 text-[15px] leading-6">{itemText}</span>
                      </li>
                      ))}
                  </ul>
                </div>
              );
            })}
          </div>
          {visibleServices.length === 0 ? (
            <div className="mt-6 text-center py-6 border border-dashed border-[var(--navy)]/25 rounded-xl text-[var(--dark-text)]/70">
              Daftar layanan akan tampil setelah diisi melalui halaman admin.
            </div>
          ) : null}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[var(--gold)] tracking-[0.3em] uppercase text-sm font-semibold">{gallerySection.sectionLabel}</span>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--navy)] mt-4 mb-6">
              {gallerySection.title}
            </h2>
            <p className="text-[var(--dark-text)]/70 max-w-2xl mx-auto">
              {gallerySection.description}
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-[var(--cream)] border border-[var(--navy)]/10 rounded-xl p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <input
                  value={gallerySearch}
                  onChange={(event) => setGallerySearch(event.target.value)}
                  placeholder="Cari dokumentasi..."
                  className="w-full lg:w-80 px-4 py-2.5 rounded-lg border border-[var(--navy)]/20 bg-white"
                />
                <div className="flex flex-wrap gap-2">
                  {galleryCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedGalleryCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedGalleryCategory === category
                          ? 'bg-[var(--navy)] text-white'
                          : 'bg-white text-[var(--navy)] border border-[var(--navy)]/20 hover:bg-[var(--navy)]/5'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-[var(--dark-text)]/60 mt-3">
                Menampilkan {filteredGalleryItems.length} dokumentasi
                {selectedGalleryCategory !== 'Semua' ? ` kategori ${selectedGalleryCategory}` : ''}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGalleryItems.map((item, index) => (
                <div
                  key={item.id}
                  className="group bg-[var(--cream)] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="relative overflow-hidden h-64">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)]/80 via-[var(--navy)]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                    <div className="absolute top-4 left-4 bg-white/95 text-[var(--navy)] px-3 py-1 rounded-full text-xs font-semibold">
                      {item.category || 'Lainnya'}
                    </div>
                    <div className="absolute top-4 right-4 bg-[var(--gold)] text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[var(--navy)] mb-3 group-hover:text-[var(--gold)] transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-[var(--dark-text)]/70 leading-relaxed text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {filteredGalleryItems.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[var(--navy)]/25 rounded-xl text-[var(--dark-text)]/70">
                Tidak ada dokumentasi yang cocok dengan filter saat ini.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      {about.trustIndicatorsEnabled ? (
        <section className="py-20 bg-gradient-to-br from-[var(--navy)] to-[var(--ocean-blue)] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {trustIndicators.map((indicator, index) => (
                <div key={`trust-indicator-${index}`} className="space-y-2">
                  <p className="text-5xl font-bold text-[var(--gold)]">{indicator.value || '-'}</p>
                  <p className="text-white/80">{indicator.label || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-32 bg-[var(--cream)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <span className="text-[var(--gold)] tracking-[0.3em] uppercase text-sm font-semibold">{contact.sectionLabel}</span>
                <h2 className="text-4xl md:text-5xl font-bold text-[var(--navy)] mt-4 mb-6">
                  {contact.title}
                </h2>
                <p className="text-[var(--dark-text)]/70 leading-relaxed">
                  {contact.description}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--navy)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-[var(--gold)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--navy)] mb-1">{contact.emailLabel}</h4>
                    <p className="text-[var(--dark-text)]/70">{contact.emailPrimary}</p>
                    <p className="text-[var(--dark-text)]/70">{contact.emailSecondary}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--navy)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-[var(--gold)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--navy)] mb-1">{contact.phoneLabel}</h4>
                    <p className="text-[var(--dark-text)]/70">{contact.phonePrimary}</p>
                    <p className="text-[var(--dark-text)]/70">{contact.phoneSecondary}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--navy)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[var(--gold)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--navy)] mb-1">{contact.addressLabel}</h4>
                    <p className="text-[var(--dark-text)]/70">{contact.address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--navy)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-[var(--gold)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--navy)] mb-1">{contact.websiteLabel}</h4>
                    <p className="text-[var(--dark-text)]/70">{contact.website}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-[var(--navy)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-[var(--navy)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-all"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Company</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-[var(--navy)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-all"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-[var(--navy)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-all resize-none"
                    placeholder="Tell us about your business needs..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[var(--navy)] text-white py-4 rounded-lg hover:bg-[var(--gold)] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--navy)] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                  <AppLogo className="h-full w-full object-cover" />
                </div>
                <h3 className="text-lg font-bold">PT Jayeng Inti Pratama</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Your trusted partner in energy infrastructure and premium seafood export.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#about" className="hover:text-[var(--gold)] transition-colors">About Us</a></li>
                <li><a href="#services" className="hover:text-[var(--gold)] transition-colors">Services</a></li>
                <li><a href="#gallery" className="hover:text-[var(--gold)] transition-colors">Gallery</a></li>
                <li><a href="#contact" className="hover:text-[var(--gold)] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Our Services</h4>
              <ul className="space-y-2 text-sm text-white/70">
                {servicesSection.items.flatMap((service) => service.items).slice(0, 4).map((itemText) => (
                  <li key={itemText}>{itemText}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm text-white/60">
            <p>&copy; 2026 PT Jayeng Inti Pratama. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
