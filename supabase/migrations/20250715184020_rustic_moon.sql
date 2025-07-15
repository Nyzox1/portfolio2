/*
  # Créer la table content_history

  1. Nouvelle table
    - `content_history`
      - `id` (uuid, primary key)
      - `content_type` (text) - Type de contenu (hero, about, project, settings)
      - `content_id` (uuid) - ID du contenu modifié
      - `action` (text) - Action effectuée (create, update, delete, publish)
      - `old_data` (jsonb) - Anciennes données
      - `new_data` (jsonb) - Nouvelles données
      - `changed_by` (uuid) - Utilisateur qui a effectué le changement
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS sur la table `content_history`
    - Politique pour les utilisateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS content_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'publish')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_content_history_content_type ON content_history(content_type);
CREATE INDEX IF NOT EXISTS idx_content_history_content_id ON content_history(content_id);
CREATE INDEX IF NOT EXISTS idx_content_history_created_at ON content_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_history_changed_by ON content_history(changed_by);

-- Enable RLS
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs authentifiés de lire l'historique
CREATE POLICY "Authenticated users can read content history"
  ON content_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique pour permettre aux utilisateurs authentifiés d'insérer dans l'historique
CREATE POLICY "Authenticated users can insert content history"
  ON content_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = changed_by);