-- Normalize utility_bills table to snake_case
-- This script fixes the "Erro ao salvar conta" by standardizing column names.

DO $$ 
BEGIN
    -- consumerUnit -> consumer_unit
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'utility_bills' AND column_name = 'consumerUnit') THEN
        ALTER TABLE public.utility_bills RENAME COLUMN "consumerUnit" TO consumer_unit;
    END IF;

    -- referenceMonth -> reference_month
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'utility_bills' AND column_name = 'referenceMonth') THEN
        ALTER TABLE public.utility_bills RENAME COLUMN "referenceMonth" TO reference_month;
    END IF;

    -- dueDate -> due_date
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'utility_bills' AND column_name = 'dueDate') THEN
        ALTER TABLE public.utility_bills RENAME COLUMN "dueDate" TO due_date;
    END IF;

    -- paymentDate -> payment_date
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'utility_bills' AND column_name = 'paymentDate') THEN
        ALTER TABLE public.utility_bills RENAME COLUMN "paymentDate" TO payment_date;
    END IF;
END $$;
