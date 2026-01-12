ALTER TABLE contract_amendments 
ADD COLUMN IF NOT EXISTS pgm_history JSONB DEFAULT '[]'::jsonb;
