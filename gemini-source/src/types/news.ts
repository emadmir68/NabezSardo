export type Locale = 'fa' | 'en';
export type ThemeMode = 'dark' | 'light';

export type CategoryId =
  | 'sarduiyeh'
  | 'agriculture'
  | 'social'
  | 'culture'
  | 'weather'
  | 'incidents'
  | 'opinion'
  | 'politics'
  | 'sports'
  | 'short-news';

export type RegionId =
  | 'sarduiyeh'
  | 'jiroft'
  | 'anbarabad'
  | 'kahnuj'
  | 'south-kerman';

export type ActiveView =
  | 'home'
  | 'desks'
  | 'regions'
  | 'archive'
  | 'search'
  | 'submit'
  | 'about'
  | 'contact'
  | 'editorial-policy'
  | 'follow-up'
  | 'admin-login'
  | 'studio'
  | 'not-found';

export interface LocalizedText {
  fa: string;
  en: string;
}

export interface Article {
  id: string;
  slug: string;
  shortCode?: string;
  kicker?: string;
  title: LocalizedText;
  deck: LocalizedText;
  body: {
    fa: string[];
    en: string[];
  };
  pullQuote?: LocalizedText;
  category: CategoryId;
  region: RegionId;
  locationLabel?: string;
  author: LocalizedText;
  authorRole: LocalizedText;
  coverImage: string;
  videoUrl?: string;
  videoType?: string;
  gallery?: string[];
  imageCaption: LocalizedText;
  publishedAt: string; // ISO date string
  updatedAt?: string;
  readTimeMin: number;
  views: number;
  status: 'published' | 'draft';
  featuredInHero: boolean;
  isBreaking?: boolean;
  _summaryOnly?: boolean;
}

export interface FollowUpCase {
  id: string;
  title: string;
  promise?: string;
  promisor?: string;
  location?: string;
  deadline?: string;
  status?: 'announced' | 'started' | 'progress' | 'completed' | 'paused' | 'closed' | string;
  note?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BreakingWireConfig {
  enabled: boolean;
  kind: 'breaking' | 'announcement' | 'desk' | 'off';
  label: string;
  textFa: string;
  textEn: string;
  marker: string;
  updatedAt?: string;
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

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  source: 'editorial' | 'upload' | 'd1';
  category?: CategoryId;
  uploadedAt: string;
  sizeLabel?: string;
}

export interface SiteSettings {
  siteNameFa: string;
  siteNameEn: string;
  taglineFa: string;
  taglineEn: string;
  seoDescriptionFa: string;
  seoDescriptionEn: string;
  defaultTheme: ThemeMode;
  showBreakingWire: boolean;
  monitoringEnabled: boolean;
  blockAdsAndAdvertorials: boolean;
  blockObituaries: boolean;
  contactEmail: string;
  editorialPhone: string;
  newsroomAddressFa: string;
  newsroomAddressEn: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'info' | 'warning';
}

export interface PolicyCheckResult {
  allowed: boolean;
  reasonCode?: 'advertisement' | 'advertorial' | 'obituary';
  matchedKeyword?: string;
  message?: LocalizedText;
}
