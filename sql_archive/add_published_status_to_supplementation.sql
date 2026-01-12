-- Atualizar a restrição de verificação (CHECK constraint) para permitir o status 'published'
ALTER TABLE supplementation_requests DROP CONSTRAINT IF EXISTS supplementation_requests_status_check;

ALTER TABLE supplementation_requests 
ADD CONSTRAINT supplementation_requests_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'published'));
