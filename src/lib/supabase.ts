import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interface pour les profils utilisateurs
export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role: 'super_admin' | 'admin' | 'editor' | 'user';
  status: 'active' | 'suspended' | 'pending' | 'banned';
  email_verified: boolean;
  last_login_at?: string;
  login_attempts: number;
  locked_until?: string;
  preferences: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Alias pour compatibilité
export interface Profile extends UserProfile {
  email?: string;
  is_active?: boolean;
}

// Types pour TypeScript
export interface SiteSettings {
  id: string;
  site_title: string;
  site_description: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  social_links: Record<string, string>;
  seo_settings: Record<string, any>;
  updated_at: string;
  updated_by?: string;
}

export interface HeroSection {
  id: string;
  badge_text: string;
  title_line1: string;
  title_line2: string;
  description: string;
  background_image_url?: string;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface AboutSection {
  id: string;
  title: string;
  description: string;
  profile_image_url?: string;
  skills: Array<{ name: string; level: number }>;
  stats: Array<{ label: string; value: string }>;
  technologies: Array<{ name: string; category: string }>;
  cv_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  gallery_urls: string[];
  tags: string[];
  category: string;
  live_url?: string;
  github_url?: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  replied_at?: string;
  replied_by?: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  alt_text?: string;
  description?: string;
  tags: string[];
  is_optimized: boolean;
  uploaded_by?: string;
  created_at: string;
}

export interface ContentDraft {
  id: string;
  content_type: 'hero' | 'about' | 'project' | 'settings';
  content_id?: string;
  draft_data: Record<string, any>;
  title?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentHistory {
  id: string;
  content_type: string;
  content_id: string;
  action: 'create' | 'update' | 'delete' | 'publish';
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  changed_by?: string;
  created_at: string;
}