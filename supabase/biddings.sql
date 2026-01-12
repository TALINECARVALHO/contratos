-- Tabela de Licitações
CREATE TABLE IF NOT EXISTS biddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  bidding_id TEXT NOT NULL UNIQUE,
  modality TEXT NOT NULL,
  department TEXT NOT NULL,
  object TEXT NOT NULL,
  process_number TEXT,
  
  publication_date DATE,
  opening_date DATE,
  homologation_date DATE,
  signature_date DATE,
  
  estimated_value DECIMAL(15,2),
  adjudicated_value DECIMAL(15,2),
  
  winner TEXT,
  
  status TEXT NOT NULL DEFAULT 'em_preparacao',
  notes TEXT,
  
  result_type TEXT, -- 'contract' ou 'minute'
  result_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT bidding_id_format CHECK (bidding_id ~ '^\d+/\d{4}$')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_biddings_department ON biddings(department);
CREATE INDEX IF NOT EXISTS idx_biddings_status ON biddings(status);
CREATE INDEX IF NOT EXISTS idx_biddings_year ON biddings(year);
CREATE INDEX IF NOT EXISTS idx_biddings_opening_date ON biddings(opening_date);
CREATE INDEX IF NOT EXISTS idx_biddings_result ON biddings(result_type, result_id);

-- RLS Policies
ALTER TABLE biddings ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar
DROP POLICY IF EXISTS "Biddings are viewable by authenticated users" ON biddings;
CREATE POLICY "Biddings are viewable by authenticated users"
  ON biddings FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem inserir (temporariamente permite todos até configurar roles)
DROP POLICY IF EXISTS "Biddings are insertable by admins" ON biddings;
CREATE POLICY "Biddings are insertable by admins"
  ON biddings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Apenas admins podem atualizar (temporariamente permite todos até configurar roles)
DROP POLICY IF EXISTS "Biddings are updatable by admins" ON biddings;
CREATE POLICY "Biddings are updatable by admins"
  ON biddings FOR UPDATE
  TO authenticated
  USING (true);

-- Apenas super_admins podem deletar (temporariamente permite todos até configurar roles)
DROP POLICY IF EXISTS "Biddings are deletable by super admins" ON biddings;
CREATE POLICY "Biddings are deletable by super admins"
  ON biddings FOR DELETE
  TO authenticated
  USING (true);
