-- Padronizar nomes de departamento: ADM -> ADMINISTRAÇÃO

-- 1. Departments table (tabela de configurações)
UPDATE departments 
SET name = 'ADMINISTRAÇÃO' 
WHERE name = 'ADM';

-- 2. Contracts
UPDATE contracts 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 3. Minutes (Atas)
UPDATE minutes 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 4. Utility Bills (Contas de Consumo)
UPDATE utility_bills 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 5. Utility Units (Unidades Consumidoras)
UPDATE utility_units 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 6. Utility Commitments (Empenhos de Consumo)
UPDATE utility_commitments 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 7. Purchase Requests (Solicitações de Compra/Empenho)
UPDATE purchase_requests 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 8. Supplementation Requests (Suplementação)
UPDATE supplementation_requests 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 9. Profiles (Usuários)
UPDATE profiles 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 10. Biddings (Licitações)
UPDATE biddings 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 11. Daily Allowances (Diárias)
UPDATE daily_allowances 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';
