-- Adicionar colunas para o fluxo financeiro de diárias
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS commitmentNumber TEXT;
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS paymentOrderNumber TEXT;
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS paymentOrderDate TIMESTAMP WITH TIME ZONE;
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS rejectionReason TEXT;
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Adicionar colunas de metadados importantes (caso falte)
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'antecipated';
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS agency TEXT;
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS "beneficiaryRole" TEXT;
ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS "department" TEXT;

-- Atualizar a restrição de status (se existir) para permitir os novos estados
-- Primeiro removemos a constraint antiga se ela existir
ALTER TABLE daily_allowances DROP CONSTRAINT IF EXISTS daily_allowances_status_check;

-- Adicionamos a nova constraint com todos os status do fluxo
ALTER TABLE daily_allowances 
ADD CONSTRAINT daily_allowances_status_check 
CHECK (status IN (
    'requested', 
    'approved', 
    'committed', 
    'payment_ordered', 
    'paid', 
    'rejected', 
    'accountability_analysis', 
    'accountability_approved', 
    'accountability_rejected'
));
