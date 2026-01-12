-- Corrigir a caixa (casing) da coluna rejectionReason
-- O sistema usa identificadores entre aspas (CamelCase), mas criamos tudo minúsculo antes.

-- 1. Renomear se existir a versão minúscula
DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name = 'daily_allowances'
    AND column_name = 'rejectionreason')
  THEN
      ALTER TABLE daily_allowances RENAME COLUMN rejectionreason TO "rejectionReason";
  ELSE
      -- Se não existir a minúscula, cria a correta diretamente
      ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
  END IF;
END $$;

-- 2. Garantir outras colunas com aspas corretamente também, caso tenham sido criadas erradas
DO $$
BEGIN
  -- commitmentNumber
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'daily_allowances' AND column_name = 'commitmentnumber') THEN
      ALTER TABLE daily_allowances RENAME COLUMN commitmentnumber TO "commitmentNumber";
  ELSE
      ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS "commitmentNumber" TEXT;
  END IF;

  -- paymentOrderNumber
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'daily_allowances' AND column_name = 'paymentordernumber') THEN
      ALTER TABLE daily_allowances RENAME COLUMN paymentordernumber TO "paymentOrderNumber";
  ELSE
      ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS "paymentOrderNumber" TEXT;
  END IF;

  -- paymentOrderDate
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'daily_allowances' AND column_name = 'paymentorderdate') THEN
      ALTER TABLE daily_allowances RENAME COLUMN paymentorderdate TO "paymentOrderDate";
  ELSE
      ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS "paymentOrderDate" TIMESTAMP WITH TIME ZONE;
  END IF;
  
   -- bankName
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'daily_allowances' AND column_name = 'bankname') THEN
      ALTER TABLE daily_allowances RENAME COLUMN bankname TO "bankName";
  ELSE
      ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS "bankName" TEXT;
  END IF;
  
   -- accountNumber
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'daily_allowances' AND column_name = 'accountnumber') THEN
      ALTER TABLE daily_allowances RENAME COLUMN accountnumber TO "accountNumber";
  ELSE
      ALTER TABLE daily_allowances ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
  END IF;
END $$;

-- 3. Atualizar Schema Cache
NOTIFY pgrst, 'reload config';
