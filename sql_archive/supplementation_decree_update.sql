-- Add Decree fields to Supplementation Requests
ALTER TABLE public.supplementation_requests
ADD COLUMN IF NOT EXISTS decree_number TEXT,
ADD COLUMN IF NOT EXISTS decree_date DATE;

-- Comment on columns
COMMENT ON COLUMN public.supplementation_requests.decree_number IS 'Number of the decree authorizing this supplementation';
COMMENT ON COLUMN public.supplementation_requests.decree_date IS 'Date of the decree';
