-- Tabela de configuração de visibilidade de menus
CREATE TABLE IF NOT EXISTS menu_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  biddings_enabled BOOLEAN DEFAULT true,
  fiscalization_enabled BOOLEAN DEFAULT true,
  reports_enabled BOOLEAN DEFAULT true,
  pgm_dispatch_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir configuração padrão (todos habilitados)
INSERT INTO menu_settings (id, biddings_enabled, fiscalization_enabled, reports_enabled, pgm_dispatch_enabled)
VALUES (1, true, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE menu_settings ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar
DROP POLICY IF EXISTS "Menu settings viewable by authenticated users" ON menu_settings;
CREATE POLICY "Menu settings viewable by authenticated users"
  ON menu_settings FOR SELECT
  TO authenticated
  USING (true);

-- Apenas super_admin pode atualizar
DROP POLICY IF EXISTS "Menu settings updatable by authenticated users" ON menu_settings;
CREATE POLICY "Menu settings updatable by authenticated users"
  ON menu_settings FOR UPDATE
  TO authenticated
  USING (true);
