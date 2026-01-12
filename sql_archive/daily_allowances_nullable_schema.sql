-- Make columns nullable in daily_allowances to support simplified solicitation
ALTER TABLE public.daily_allowances 
ALTER COLUMN "beneficiaryRole" DROP NOT NULL,
ALTER COLUMN department DROP NOT NULL,
ALTER COLUMN destination DROP NOT NULL,
ALTER COLUMN "missionDescription" DROP NOT NULL,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL,
ALTER COLUMN "totalValue" DROP NOT NULL;
