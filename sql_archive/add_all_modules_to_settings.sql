-- Add missing columns to menu_settings table
ALTER TABLE menu_settings 
ADD COLUMN IF NOT EXISTS contracts_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS minutes_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS purchase_requests_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS daily_allowance_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS utility_bills_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS supplementation_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS users_enabled BOOLEAN DEFAULT TRUE;

-- Update existing row to ensure defaults (optional, as DEFAULT TRUE handles new rows, but good for existing)
UPDATE menu_settings 
SET 
  contracts_enabled = TRUE,
  minutes_enabled = TRUE,
  purchase_requests_enabled = TRUE,
  daily_allowance_enabled = TRUE,
  utility_bills_enabled = TRUE,
  supplementation_enabled = TRUE,
  users_enabled = TRUE
WHERE id = 1 AND contracts_enabled IS NULL;
