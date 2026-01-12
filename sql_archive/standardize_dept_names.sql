-- Standardize Department names: ADM -> ADMINISTRAÇÃO

-- 1. Update the departments parameters table
UPDATE departments 
SET name = 'ADMINISTRAÇÃO' 
WHERE name = 'ADM';

-- 2. Update contracts
UPDATE contracts 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 3. Update minutes
UPDATE minutes 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 4. Update utility_bills
UPDATE utility_bills 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 5. Update utility_units
UPDATE utility_units 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 6. Update utility_commitments
UPDATE utility_commitments 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 7. Update purchase_requests
UPDATE purchase_requests 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 8. Update supplementation_requests
UPDATE supplementation_requests 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';

-- 9. Update users
UPDATE profiles 
SET department = 'ADMINISTRAÇÃO' 
WHERE department = 'ADM';
