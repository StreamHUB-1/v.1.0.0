export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  views: number;
  uploadDate: string;
  category: string;
  uploader: string;
}

export interface User {
  username: string;
  role: UserRole | string;
  tokens: string | number;
  nickname?: string;
  profilePic?: string;
  lastLoginDate?: string;
}

export interface StoreItem {
  name: string;
  price: string | number;
  description: string;
  duration: string;
  typeCard: string;
  tokenAmount: string | number;
}

export interface StoreOptions {
  waktu: string[];
  types: string[];
}

export type SortOption = 'date' | 'views' | 'title';

export type ViewState = 'home' | 'store' | 'genre' | 'features' | 'admin';

export type UserRole = 'admin' | 'donatur' | 'trial_donatur' | 'free' | 'guest';