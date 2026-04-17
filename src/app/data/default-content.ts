import type { SiteContent } from '../types/site-content';

export const defaultContent: SiteContent = {
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
    trustIndicatorsEnabled: true,
    trustIndicators: [
      {
        value: '15+',
        label: 'Years Experience',
      },
      {
        value: '500+',
        label: 'Projects Completed',
      },
      {
        value: '15+',
        label: 'Export Countries',
      },
      {
        value: '100%',
        label: 'Client Satisfaction',
      },
    ],
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
