
export const DB_CONFIG_SQL = `-- =================================================================
-- SCRIPT DE ATUALIZAÇÃO DE PARÂMETROS DINÂMICOS (v13.0)
-- Foco: Criação da Tabela minute_types e Correção de Cache
-- =================================================================

-- 1. CRIAR TABELAS DE PARÂMETROS SE NÃO EXISTIREM
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.minute_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOVO: TABELA DE ADITIVOS
CREATE TABLE IF NOT EXISTS public.contract_amendments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_id BIGINT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('prazo', 'valor')),
  duration NUMERIC DEFAULT 0,
  duration_unit TEXT CHECK (duration_unit IN ('dia', 'mes', 'ano')),
  event_name TEXT,
  entry_date DATE,
  status TEXT DEFAULT 'ELABORANDO',
  checklist JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  folder_link TEXT,
  contracts_sector_notes TEXT,
  pgm_notes TEXT,
  pgm_decision TEXT
);

-- GARANTIR COLUNAS EM TABELAS EXISTENTES
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='contract_amendments' AND COLUMN_NAME='folder_link') THEN
        ALTER TABLE public.contract_amendments ADD COLUMN folder_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='contract_amendments' AND COLUMN_NAME='contracts_sector_notes') THEN
        ALTER TABLE public.contract_amendments ADD COLUMN contracts_sector_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='contract_amendments' AND COLUMN_NAME='pgm_notes') THEN
        ALTER TABLE public.contract_amendments ADD COLUMN pgm_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='contract_amendments' AND COLUMN_NAME='pgm_decision') THEN
        ALTER TABLE public.contract_amendments ADD COLUMN pgm_decision TEXT;
    END IF;
END $$;

-- 2. HABILITAR RLS (Segurança em nível de linha)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minute_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_amendments ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS DE ACESSO (Se não existirem)
DO $$ 
BEGIN
    -- Departments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dept_read_all') THEN
        CREATE POLICY "dept_read_all" ON public.departments FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dept_admin_all') THEN
        CREATE POLICY "dept_admin_all" ON public.departments FOR ALL USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
        );
    END IF;

    -- Document Types
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dtype_read_all') THEN
        CREATE POLICY "dtype_read_all" ON public.document_types FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dtype_admin_all') THEN
        CREATE POLICY "dtype_admin_all" ON public.document_types FOR ALL USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
        );
    END IF;

    -- Minute Types
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'mtype_read_all') THEN
        CREATE POLICY "mtype_read_all" ON public.minute_types FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'mtype_admin_all') THEN
        CREATE POLICY "mtype_admin_all" ON public.minute_types FOR ALL USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
        );
    END IF;

    -- Amendments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'amendment_read_all') THEN
        CREATE POLICY "amendment_read_all" ON public.contract_amendments FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'amendment_write_all') THEN
        CREATE POLICY "amendment_write_all" ON public.contract_amendments FOR INSERT USING (
            auth.uid() IS NOT NULL
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'amendment_update_all') THEN
        CREATE POLICY "amendment_update_all" ON public.contract_amendments FOR UPDATE USING (
            auth.uid() IS NOT NULL
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'amendment_delete_admin') THEN
        CREATE POLICY "amendment_delete_admin" ON public.contract_amendments FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
        );
    END IF;
END $$;

-- 4. DADOS INICIAIS PARA NOVAS INSTALAÇÕES
INSERT INTO public.departments (name)
SELECT name FROM unnest(ARRAY['ADM', 'SAÚDE', 'EDUCAÇÃO', 'OBRAS', 'FAZENDA', 'MEIO AMBIENTE', 'TURISMO', 'PLANEJAMENTO', 'GABINETE', 'DES. SOCIAL', 'AGRICULTURA', 'CPD', 'FROTAS', 'ESPORTE', 'RPPS', 'INTERIOR']) as name
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.document_types (name)
SELECT name FROM unnest(ARRAY['ACOLHIMENTO ILPI', 'AQUISIÇÃO', 'CONSULTORIA/ASSESSORIA', 'CONTÍNUO', 'PRESTAÇÃO DE SERVIÇO', 'CREDENCIAMENTO SAÚDE', 'DOAÇÃO', 'ESTACIONAMENTO ROTATIVO', 'EVENTO', 'LOCAÇÃO', 'MANUTENÇÃO DE VEÍCULOS', 'OBRAS', 'PARCERIA/FOMENTO/COLABORAÇÃO', 'PERMISSÃO DE USO', 'DISPENSA', 'PROJETO', 'SOFTWARE', 'TRANSPORTE ESCOLAR', 'PATROCÍNIO']) as name
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.minute_types (name)
SELECT name FROM unnest(ARRAY['ITEM', 'SERVIÇO', 'OBRA']) as name
ON CONFLICT (name) DO NOTHING;

-- 5. GARANTIR QUE A ROLE PGM SEJA ACEITA NA TABELA PROFILES
DO $$ 
BEGIN 
    -- Tenta remover a restrição antiga se existir (nomes comuns: profiles_role_check)
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    -- Cria a restrição atualizada incluindo 'pgm'
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'admin', 'manager', 'pgm', 'user'));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Não foi possível atualizar a restrição de role. Verifique se o nome da constraint está correto.';
END $$;

-- 6. FORÇAR RECARREGAMENTO DO CACHE DO POSTGREST
NOTIFY pgrst, 'reload schema';

`;
