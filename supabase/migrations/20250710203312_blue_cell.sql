/*
  # Schéma complet pour le portfolio admin

  1. Nouvelles tables
    - `site_settings` - Configuration générale du site
    - `hero_sections` - Contenu de la section hero
    - `about_sections` - Contenu de la section à propos
    - `projects` - Projets du portfolio
    - `contact_messages` - Messages de contact
    - `media_files` - Gestion des médias
    - `content_drafts` - Système de brouillons
    - `content_history` - Historique des modifications

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour l'accès admin uniquement
    - Authentification requise pour toutes les opérations
*/

-- Table des paramètres généraux du site
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Table pour la section hero
CREATE TABLE IF NOT EXISTS hero_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Table pour la section à propos
CREATE TABLE IF NOT EXISTS about_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Table des projets
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Table des messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Table de gestion des médias
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Table des brouillons
CREATE TABLE IF NOT EXISTS content_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('hero', 'about', 'project', 'settings')),
  content_id uuid,
  draft_data jsonb NOT NULL,
  title text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table de l'historique
CREATE TABLE IF NOT EXISTS content_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'publish')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Activation de RLS sur toutes les tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour l'accès admin uniquement
CREATE POLICY "Admin access only" ON site_settings
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@alexdev.com');

CREATE POLICY "Admin access only" ON hero_sections
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@alexdev.com');

CREATE POLICY "Admin access only" ON about_sections
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@alexdev.com');

CREATE POLICY "Admin access only" ON projects
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@alexdev.com');

CREATE POLICY "Admin access only" ON contact_messages
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@alexdev.com');

CREATE POLICY "Admin access only" ON media_files
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@alexdev.com');

CREATE POLICY "Admin access only" ON content_drafts
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@alexdev.com');

CREATE POLICY "Admin access only" ON content_history
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@alexdev.com');

-- Insertion des données par défaut
INSERT INTO site_settings (site_title, site_description) VALUES 
('Alex.dev', 'Développeur Full-Stack & UI/UX Designer');

INSERT INTO hero_sections (badge_text, title_line1, title_line2, description) VALUES 
('Portfolio Développeur', 'Alex Développeur', 'Full-Stack & UI/UX Designer', 'Crafting exceptional digital experiences through innovative design and cutting-edge technology.');

INSERT INTO about_sections (title, description, skills, stats, technologies) VALUES 
('À propos de moi', 'Développeur passionné avec plus de 5 ans d''expérience dans la création d''applications web modernes et d''expériences utilisateur exceptionnelles', 
'[{"name": "Frontend Development", "level": 95}, {"name": "Backend Development", "level": 88}, {"name": "UI/UX Design", "level": 90}, {"name": "DevOps & Cloud", "level": 80}]',
'[{"label": "Projets réalisés", "value": "50+"}, {"label": "Clients satisfaits", "value": "30+"}, {"label": "Années d''expérience", "value": "5+"}, {"label": "Cafés consommés", "value": "∞"}]',
'[{"name": "React", "category": "Frontend"}, {"name": "TypeScript", "category": "Language"}, {"name": "Node.js", "category": "Backend"}, {"name": "Python", "category": "Language"}]');

-- Fonctions pour l'historique automatique
CREATE OR REPLACE FUNCTION log_content_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO content_history (content_type, content_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'create', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO content_history (content_type, content_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO content_history (content_type, content_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour l'historique
CREATE TRIGGER hero_sections_history AFTER INSERT OR UPDATE OR DELETE ON hero_sections
  FOR EACH ROW EXECUTE FUNCTION log_content_changes();

CREATE TRIGGER about_sections_history AFTER INSERT OR UPDATE OR DELETE ON about_sections
  FOR EACH ROW EXECUTE FUNCTION log_content_changes();

CREATE TRIGGER projects_history AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION log_content_changes();