-- Primeiro, remover a tabela se existir
DROP TABLE IF EXISTS biddings CASCADE;

-- Criar a tabela de licitações
CREATE TABLE biddings (
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
  
  result_type TEXT,
  result_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT bidding_id_format CHECK (bidding_id ~ '^\d+/\d{4}$')
);

-- Índices para performance
CREATE INDEX idx_biddings_department ON biddings(department);
CREATE INDEX idx_biddings_status ON biddings(status);
CREATE INDEX idx_biddings_year ON biddings(year);
CREATE INDEX idx_biddings_opening_date ON biddings(opening_date);
CREATE INDEX idx_biddings_result ON biddings(result_type, result_id);

-- Habilitar RLS
ALTER TABLE biddings ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem visualizar
CREATE POLICY "Biddings are viewable by authenticated users"
  ON biddings FOR SELECT
  TO authenticated
  USING (true);

-- Política: Todos podem inserir (temporário)
CREATE POLICY "Biddings are insertable by authenticated users"
  ON biddings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Todos podem atualizar (temporário)
CREATE POLICY "Biddings are updatable by authenticated users"
  ON biddings FOR UPDATE
  TO authenticated
  USING (true);

-- Política: Todos podem deletar (temporário)
CREATE POLICY "Biddings are deletable by authenticated users"
  ON biddings FOR DELETE
  TO authenticated
  USING (true);

-- Garantir que a tabela está no schema público
COMMENT ON TABLE biddings IS 'Tabela de controle de licitações municipais';
