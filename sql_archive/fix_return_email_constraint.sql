-- Remove the NOT NULL constraint from return_email 
ALTER TABLE supplementation_requests 
ALTER COLUMN return_email DROP NOT NULL;
