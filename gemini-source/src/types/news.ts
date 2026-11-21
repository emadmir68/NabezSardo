export type Locale = 'fa' | 'en';
export type ThemeMode = 'dark' | 'light';

export type CategoryId =
  | 'sarduiyeh'
  | 'agriculture'
  | 'social'
  | 'culture'
  | 'weather'
  | 'incidents'
  | 'opinion';

export type RegionId =
  | 'sarduiyeh'
  | 'jiroft'
  | 'anbarabad'
  | 'kahnuj'
  | 'south-kerman';

export type ActiveView = 'home' | 'desks' | 'archive' | 'submit' | 'studio';

export interface LocalizedText {
  fa: string;
  en: string;
}

export interface Article {
  id: string;
  slug: string;
  title: LocalizedText;
  deck: LocalizedText;
  body: {
    fa: string[];
    en: string[];
  };
  pullQuote?: LocalizedText;
  category: CategoryId;
  region: RegionId;
  author: LocalizedText;
  authorRole: LocalizedText;
  coverImage: string;
  imageCaption: LocalizedText;
  publishedAt: string; // ISO date string
  readTimeMin: number;
  views: number;
  status: 'published' | 'draft';
  featuredInHero: boolean;
  isBreaking?: boolean;
}

export interface CitizenReport {
  id: string;
  title: string;
  description: string;
  region: RegionId;
  category: CategoryId;
  reporterName: string;
  contact?: string;
  imageDataUrl?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'archived';
}

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'info' | 'warning';
}
