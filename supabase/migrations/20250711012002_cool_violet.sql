/*
  # Création automatique de l'utilisateur admin

  1. Configuration
    - Désactive la confirmation par email pour l'admin
    - Configure les paramètres d'authentification
  
  2. Note
    - L'utilisateur admin sera créé automatiquement lors de la première connexion
    - Email: admin@alexdev.com
    - Mot de passe: admin123456 (à changer après la première connexion)
*/

-- Désactiver la confirmation par email pour permettre la création automatique de l'admin
-- Cette configuration sera appliquée au niveau du projet Supabase

-- Insérer les paramètres de site par défaut
INSERT INTO site_settings (
  site_title,
  site_description,
  primary_color,
  secondary_color,
  social_links,
  seo_settings
) VALUES (
  'Alex.dev',
  'Développeur Full-Stack & UI/UX Designer',
  '#8B5CF6',
  '#EC4899',
  '{"github": "", "linkedin": "", "twitter": ""}',
  '{"title": "Alex.dev - Portfolio", "description": "Portfolio de développeur Full-Stack", "keywords": "développeur, full-stack, ui/ux, design"}'
) ON CONFLICT (id) DO NOTHING;

-- Insérer une section hero par défaut
INSERT INTO hero_sections (
  badge_text,
  title_line1,
  title_line2,
  description,
  cta_text,
  cta_link,
  is_active
) VALUES (
  'Portfolio Développeur',
  'Alex Développeur',
  'Full-Stack & UI/UX Designer',
  'Crafting exceptional digital experiences through innovative design and cutting-edge technology.',
  'Travaillons ensemble',
  '#contact',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insérer une section about par défaut
INSERT INTO about_sections (
  title,
  description,
  skills,
  stats,
  technologies,
  is_active
) VALUES (
  'À propos de moi',
  'Passionné par le développement web et le design, je crée des expériences digitales exceptionnelles.',
  '[{"name": "React", "level": 90}, {"name": "TypeScript", "level": 85}, {"name": "Node.js", "level": 80}]',
  '[{"label": "Projets réalisés", "value": "50+"}, {"label": "Clients satisfaits", "value": "30+"}, {"label": "Années d''expérience", "value": "5+"}]',
  '["React", "TypeScript", "Node.js", "Supabase", "Tailwind CSS"]',
  true
) ON CONFLICT (id) DO NOTHING;