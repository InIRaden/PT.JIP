export type ServiceIcon = 'zap' | 'ship';

export type HomeContent = {
  badge: string;
  title: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  primaryCtaText: string;
  secondaryCtaText: string;
};

export type AboutContent = {
  sectionLabel: string;
  title: string;
  imagePrimary: string;
  imagePrimaryAlt: string;
  imageSecondary: string;
  imageSecondaryAlt: string;
  descriptionOne: string;
  descriptionTwo: string;
  experienceEnabled: boolean;
  experienceValue: string;
  experienceLabel: string;
  trustIndicatorsEnabled: boolean;
  trustIndicators: Array<{
    value: string;
    label: string;
  }>;
};

export type ServiceItem = {
  id: number;
  title: string;
  description: string;
  items: string[];
  icon: ServiceIcon;
};

export type GalleryItem = {
  id: number;
  category: string;
  image: string;
  title: string;
  description: string;
};

export type ContactContent = {
  sectionLabel: string;
  title: string;
  description: string;
  emailLabel: string;
  emailPrimary: string;
  emailSecondary: string;
  phoneLabel: string;
  phonePrimary: string;
  phoneSecondary: string;
  addressLabel: string;
  address: string;
  websiteLabel: string;
  website: string;
};

export type SiteContent = {
  home: HomeContent;
  about: AboutContent;
  services: {
    sectionLabel: string;
    title: string;
    description: string;
    items: ServiceItem[];
  };
  gallery: {
    sectionLabel: string;
    title: string;
    description: string;
    items: GalleryItem[];
  };
  contact: ContactContent;
};
