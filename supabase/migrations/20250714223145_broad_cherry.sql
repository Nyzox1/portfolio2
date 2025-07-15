/*
  # Fix Missing Database Tables and Functions

  This migration creates all the missing database entities that are causing the application errors:
  
  1. Tables:
     - user_profiles (for user management)
     - system_settings (for application configuration)
     - user_sessions (for session management)
     - audit_logs (for audit trail)
     - login_attempts (for security tracking)
  
  2. Functions:
     - cleanup_expired_sessions (for session cleanup)
     - handle_new_user (for automatic profile creation)
     - update_updated_at_column (for timestamp updates)
  
  3. Security:
     - RLS policies for all tables
     - Proper permissions and constraints
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'editor', 'user')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'banned')),
  email_verified boolean DEFAULT false,
  last_login_at timestamptz,
  login_attempts integer DEFAULT 0,
  locked_until timestamptz,
  preferences jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL,
  remember_me boolean DEFAULT false,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create login_attempts table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email text NOT NULL,
  ip_address inet,
  success boolean NOT NULL,
  error_type text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON public.user_profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

-- RLS Policies for system_settings
CREATE POLICY "Super admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND status = 'active'
    )
  );

CREATE POLICY "Public can read some system settings" ON public.system_settings
  FOR SELECT USING (setting_key IN ('global_signup_enabled', 'email_verification_required'));

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for login_attempts
CREATE POLICY "Admins can view login attempts" ON public.login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "System can insert login attempts" ON public.login_attempts
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, status, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email = 'admin@nyzox.tech' THEN 'super_admin'
      ELSE 'user'
    END,
    'active',
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_sessions 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('global_signup_enabled', 'true', 'Allow new user registrations'),
  ('email_verification_required', 'true', 'Require email verification for new accounts'),
  ('password_min_length', '8', 'Minimum password length'),
  ('max_login_attempts', '5', 'Maximum failed login attempts before account lockout'),
  ('session_timeout_hours', '24', 'Session timeout in hours')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default hero section if it doesn't exist
INSERT INTO public.hero_sections (
  badge_text,
  title_line1,
  title_line2,
  description,
  cta_text,
  cta_link,
  is_active
) VALUES (
  'Portfolio Développeur',
  'Votre Nom',
  'Full-Stack & UI/UX Designer',
  'Crafting exceptional digital experiences through innovative design and cutting-edge technology.',
  'Travaillons ensemble',
  '#contact',
  true
) ON CONFLICT DO NOTHING;

-- Insert default about section if it doesn't exist
INSERT INTO public.about_sections (
  title,
  description,
  skills,
  stats,
  technologies,
  is_active
) VALUES (
  'À propos de moi',
  'Passionné par le développement web et le design, je crée des expériences numériques exceptionnelles.',
  '["JavaScript", "React", "Node.js", "TypeScript", "Python"]',
  '[{"label": "Projets Complétés", "value": "50+"}, {"label": "Clients Satisfaits", "value": "30+"}, {"label": "Années d''Expérience", "value": "5+"}]',
  '["React", "Vue.js", "Node.js", "Python", "PostgreSQL", "MongoDB"]',
  true
) ON CONFLICT DO NOTHING;

-- Insert default site settings if it doesn't exist
INSERT INTO public.site_settings (
  site_title,
  site_description,
  primary_color,
  secondary_color,
  social_links,
  seo_settings
) VALUES (
  'Portfolio Dev',
  'Développeur Full-Stack & UI/UX Designer',
  '#8B5CF6',
  '#EC4899',
  '{}',
  '{}'
) ON CONFLICT DO NOTHING;

-- Insert sample projects if they don't exist
INSERT INTO public.projects (title, description, category, tags, is_featured, is_published, sort_order) VALUES
  ('E-Commerce Platform', 'Une plateforme e-commerce moderne avec React et Node.js', 'Web Development', '["React", "Node.js", "MongoDB", "Stripe"]', true, true, 1),
  ('Mobile Banking App', 'Application mobile de banque avec React Native', 'Mobile Development', '["React Native", "TypeScript", "Firebase"]', true, true, 2),
  ('AI Dashboard', 'Dashboard d''analyse avec intelligence artificielle', 'Data Science', '["Python", "TensorFlow", "React", "D3.js"]', true, true, 3),
  ('Portfolio Website', 'Site portfolio responsive avec animations', 'Web Design', '["HTML", "CSS", "JavaScript", "GSAP"]', false, true, 4),
  ('Task Management Tool', 'Outil de gestion de tâches collaboratif', 'Productivity', '["Vue.js", "Express", "PostgreSQL"]', false, true, 5),
  ('Weather App', 'Application météo avec géolocalisation', 'Mobile Development', '["React Native", "API", "Maps"]', false, true, 6)
ON CONFLICT DO NOTHING;