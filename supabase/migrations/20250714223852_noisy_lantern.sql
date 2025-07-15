/*
  # Reconstruction complète de la base de données

  1. Suppression de toutes les tables existantes
  2. Création du nouveau schéma d'authentification
  3. Tables principales :
     - user_profiles (profils utilisateurs)
     - system_settings (paramètres système)
     - audit_logs (logs d'audit)
     - login_attempts (tentatives de connexion)
  4. Fonctions et triggers
  5. Politiques RLS
  6. Données par défaut
  7. Utilisateur admin initial
*/

-- Supprimer toutes les tables existantes
DROP TABLE IF EXISTS content_drafts CASCADE;
DROP TABLE IF EXISTS content_history CASCADE;
DROP TABLE IF EXISTS hero_sections CASCADE;
DROP TABLE IF EXISTS about_sections CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS media_files CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS log_content_changes() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs (liée à auth.users)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Index pour les performances
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_user_profiles_email_verified ON user_profiles(email_verified);

-- Table des paramètres système
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Table des logs d'audit
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Table des tentatives de connexion
CREATE TABLE login_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  ip_address inet,
  success boolean NOT NULL,
  error_type text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);

-- Table des sessions utilisateur
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  remember_me boolean DEFAULT false,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Tables de contenu
CREATE TABLE hero_sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_text text DEFAULT 'Portfolio Développeur',
  title_line1 text NOT NULL DEFAULT 'Alex Développeur',
  title_line2 text NOT NULL DEFAULT 'Full-Stack & UI/UX Designer',
  description text DEFAULT 'Crafting exceptional digital experiences through innovative design and cutting-edge technology.',
  background_image_url text,
  cta_text text DEFAULT 'Travaillons ensemble',
  cta_link text DEFAULT '#contact',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE about_sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL DEFAULT 'À propos de moi',
  description text NOT NULL,
  profile_image_url text,
  skills jsonb DEFAULT '[]',
  stats jsonb DEFAULT '[]',
  technologies jsonb DEFAULT '[]',
  cv_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  gallery_urls jsonb DEFAULT '[]',
  tags jsonb DEFAULT '[]',
  category text NOT NULL,
  live_url text,
  github_url text,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE contact_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  replied_at timestamptz,
  replied_by uuid REFERENCES auth.users(id)
);

CREATE TABLE site_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_title text NOT NULL DEFAULT 'Alex.dev',
  site_description text DEFAULT 'Développeur Full-Stack & UI/UX Designer',
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT '#8B5CF6',
  secondary_color text DEFAULT '#EC4899',
  social_links jsonb DEFAULT '{}',
  seo_settings jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE media_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  width integer,
  height integer,
  alt_text text,
  description text,
  tags jsonb DEFAULT '[]',
  is_optimized boolean DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Fonctions utilitaires
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Fonction pour gérer les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role, email_verified)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.email = 'admin@nyzox.tech' THEN 'super_admin'
      ELSE 'user'
    END,
    NEW.email_confirmed_at IS NOT NULL
  );
  
  -- Log de création d'utilisateur
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    NEW.id,
    'user_created',
    'user_profile',
    NEW.id,
    jsonb_build_object('email', NEW.email, 'role', 
      CASE WHEN NEW.email = 'admin@nyzox.tech' THEN 'super_admin' ELSE 'user' END
    )
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Fonction de nettoyage des sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < now();
END;
$$ language 'plpgsql' security definer;

-- Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hero_sections_updated_at
  BEFORE UPDATE ON hero_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_about_sections_updated_at
  BEFORE UPDATE ON about_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS sur toutes les tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

-- Politiques pour system_settings
CREATE POLICY "Public can read some system settings" ON system_settings
  FOR SELECT USING (setting_key IN ('global_signup_enabled', 'email_verification_required'));

CREATE POLICY "Super admins can manage system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND status = 'active'
    )
  );

-- Politiques pour audit_logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

-- Politiques pour login_attempts
CREATE POLICY "System can insert login attempts" ON login_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view login attempts" ON login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

-- Politiques pour user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND status = 'active'
    )
  );

-- Politiques pour le contenu (hero, about, projects, etc.)
CREATE POLICY "Public can read active content" ON hero_sections
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authorized users can manage content" ON hero_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'editor')
      AND status = 'active'
    )
  );

CREATE POLICY "Public can read active content" ON about_sections
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authorized users can manage content" ON about_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'editor')
      AND status = 'active'
    )
  );

CREATE POLICY "Public can read published projects" ON projects
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authorized users can manage content" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'editor')
      AND status = 'active'
    )
  );

CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authorized users can manage content" ON contact_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'editor')
      AND status = 'active'
    )
  );

CREATE POLICY "Public can read site settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage content" ON site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'editor')
      AND status = 'active'
    )
  );

CREATE POLICY "Authorized users can manage content" ON media_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'editor')
      AND status = 'active'
    )
  );

-- Insérer les paramètres système par défaut
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('global_signup_enabled', 'true', 'Permet aux nouveaux utilisateurs de s''inscrire'),
('email_verification_required', 'false', 'Exige la vérification de l''email avant activation'),
('password_min_length', '8', 'Longueur minimale du mot de passe'),
('max_login_attempts', '5', 'Nombre maximum de tentatives de connexion'),
('session_timeout_hours', '24', 'Durée de session en heures');

-- Insérer les données par défaut pour le contenu
INSERT INTO hero_sections (badge_text, title_line1, title_line2, description) VALUES
('Just an owner of my own shit.', 'Nyzox', 'Full-Stack & UI/UX Designer', 'Passionate developer creating exceptional digital experiences with modern technologies.');

INSERT INTO about_sections (title, description, skills, stats, technologies) VALUES
('About me', 'Hi! I''m Nyzox, a full-stack developer passionate about crafting exceptional digital experiences. My journey began 5 years ago with a simple curiosity for coding, and since then, I''ve had the opportunity to work on various challenging and exciting projects.', 
'[{"name": "Frontend Development", "level": 95, "category": "Frontend"}, {"name": "Backend Development", "level": 88, "category": "Backend"}, {"name": "UI/UX Design", "level": 90, "category": "Design"}, {"name": "DevOps & Cloud", "level": 80, "category": "DevOps"}]',
'[{"label": "Projects completed", "value": "50+", "icon": "Code"}, {"label": "Happy clients", "value": "30+", "icon": "Users"}, {"label": "Years of experience", "value": "5+", "icon": "Award"}, {"label": "Coffees consumed", "value": "∞", "icon": "Coffee"}]',
'[{"name": "React", "category": "Frontend"}, {"name": "TypeScript", "category": "Language"}, {"name": "Node.js", "category": "Backend"}, {"name": "Python", "category": "Language"}, {"name": "PostgreSQL", "category": "Database"}, {"name": "MongoDB", "category": "Database"}, {"name": "AWS", "category": "Cloud"}, {"name": "Docker", "category": "DevOps"}, {"name": "Next.js", "category": "Framework"}, {"name": "Tailwind CSS", "category": "Styling"}, {"name": "Figma", "category": "Design"}, {"name": "Git", "category": "Tools"}]');

INSERT INTO site_settings (site_title, site_description, primary_color, secondary_color, social_links, seo_settings) VALUES
('nyzox.tech', 'Full-Stack Developer & UI/UX Designer', '#8B5CF6', '#EC4899', 
'{"github": "https://github.com/nyzox1", "discord": "https://discord.com/users/1055869215036424303", "email": "contact@nyzox.tech"}',
'{"meta_title": "Nyzox - Full-Stack Developer", "meta_description": "Passionate full-stack developer creating exceptional digital experiences", "meta_keywords": "developer, web, portfolio, react, typescript"}');

-- Insérer les projets d'exemple
INSERT INTO projects (title, description, image_url, tags, category, live_url, github_url, is_featured, sort_order) VALUES
('E-commerce Platform', 'A complete e-commerce platform with integrated payments, inventory management, and a modern admin dashboard.', 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=800', '["React", "Node.js", "PostgreSQL", "Stripe"]', 'fullstack', 'https://example.com', 'https://github.com', true, 0),
('Design System', 'A full design system with reusable components and interactive documentation for teams.', 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800', '["React", "TypeScript", "Storybook", "Figma"]', 'design', 'https://example.com', 'https://github.com', false, 1),
('GraphQL REST API', 'A modern API using GraphQL, JWT authentication, and auto-generated documentation for developers.', 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800', '["GraphQL", "Node.js", "MongoDB", "Apollo"]', 'backend', 'https://example.com', 'https://github.com', true, 2),
('Flutter Mobile App', 'Cross-platform mobile app with cloud sync and real-time push notifications.', 'https://images.pexels.com/photos/147413/twitter-facebook-together-exchange-of-information-147413.jpeg?auto=compress&cs=tinysrgb&w=800', '["Flutter", "Dart", "Firebase", "Android"]', 'mobile', 'https://example.com', 'https://github.com', false, 3),
('Analytics Dashboard', 'Interactive dashboard with real-time data visualizations and advanced metrics.', 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800', '["React", "D3.js", "WebSocket", "Python"]', 'frontend', 'https://example.com', 'https://github.com', true, 4),
('AI Chatbot', 'Intelligent chatbot with natural language processing and advanced machine learning.', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800', '["Python", "OpenAI", "FastAPI", "Docker"]', 'ai', 'https://example.com', 'https://github.com', false, 5);