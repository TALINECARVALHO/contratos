-- ==============================================================================
-- 1. ADICIONAR COLUNAS (Se não existirem)
-- ==============================================================================

-- Garante que a tabela profiles tem constraint única no ID (JÁ EXISTE, COMENTADO PARA EVITAR ERRO)
-- ALTER TABLE profiles ADD CONSTRAINT profiles_id_unique UNIQUE (id);

-- Adiciona colunas novas na tabela purchase_requests
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS "requester_id" uuid REFERENCES profiles(id);
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS "object" text;
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS "contractNumber" text;

-- ==============================================================================
-- 2. CORRIGIR PERMISSÕES (RLS)
-- ==============================================================================

-- Habilita segurança por linha
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- Remove TODAS as políticas antigas para começar do zero e evitar conflitos
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests viewable by department or permissions" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests insertable by authenticated users" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests updatable by department or permissions" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests deletable by department or permissions" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests viewable by department, permissions or author" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests updatable by department, permissions or author" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests deletable by department, permissions or author" ON purchase_requests;

-- --- CRIA AS POLÍTICAS DEFINITIVAS ---

-- 1. VISUALIZAR (SELECT)
-- Quem pode ver: Admins, Gestores, Pessoas da mesma Secretaria, O Próprio Autor
CREATE POLICY "Purchase Requests View Policy"
ON purchase_requests FOR SELECT
TO authenticated
USING (
  -- Admin / Super Admin
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
  OR
  -- Gestor (tem permissão manage)
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.permissions->'purchase_request'->>'manage')::boolean = true))
  OR
  -- Mesma Secretaria
  department = (SELECT department FROM profiles WHERE id = auth.uid())
  OR
  -- É o Autor
  requester_id = auth.uid()
);

-- 2. CRIAR (INSERT)
-- Quem pode criar: Qualquer usuário autenticado
CREATE POLICY "Purchase Requests Insert Policy"
ON purchase_requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. ATUALIZAR (UPDATE)
-- Quem pode editar: Admins, Gestores, Mesma Secretaria, O Próprio Autor
CREATE POLICY "Purchase Requests Update Policy"
ON purchase_requests FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
  OR
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.permissions->'purchase_request'->>'manage')::boolean = true))
  OR
  department = (SELECT department FROM profiles WHERE id = auth.uid())
  OR
  requester_id = auth.uid()
);

-- 4. EXCLUIR (DELETE)
-- Quem pode excluir: Admins, Gestores, Mesma Secretaria, O Próprio Autor
CREATE POLICY "Purchase Requests Delete Policy"
ON purchase_requests FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
  OR
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.permissions->'purchase_request'->>'manage')::boolean = true))
  OR
  department = (SELECT department FROM profiles WHERE id = auth.uid())
  OR
  requester_id = auth.uid()
);
