-- 1. Create utility_commitments table (with all updated fields)
CREATE TABLE IF NOT EXISTS utility_commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('water', 'light', 'phone', 'internet')),
    department TEXT NOT NULL,
    dotation TEXT,
    consumer_unit TEXT, -- Optional now
    total_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add columns to utility_bills if they don't exist
ALTER TABLE utility_bills ADD COLUMN IF NOT EXISTS commitment_id UUID REFERENCES utility_commitments(id);
ALTER TABLE utility_bills ADD COLUMN IF NOT EXISTS local_name TEXT;

-- 3. Update utility_bills type constraint
ALTER TABLE utility_bills DROP CONSTRAINT IF EXISTS utility_bills_type_check;
ALTER TABLE utility_bills ADD CONSTRAINT utility_bills_type_check CHECK (type IN ('water', 'light', 'phone', 'internet'));

-- 4. Function to update commitment balance (idempotent)
CREATE OR REPLACE FUNCTION update_utility_commitment_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.commitment_id IS NOT NULL THEN
            UPDATE utility_commitments
            SET balance = balance - NEW.value
            WHERE id = NEW.commitment_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If commitment changed
        IF OLD.commitment_id IS DISTINCT FROM NEW.commitment_id THEN
            -- Restore old balance
            IF OLD.commitment_id IS NOT NULL THEN
                UPDATE utility_commitments
                SET balance = balance + OLD.value
                WHERE id = OLD.commitment_id;
            END IF;
            -- Deduct from new balance
            IF NEW.commitment_id IS NOT NULL THEN
                UPDATE utility_commitments
                SET balance = balance - NEW.value
                WHERE id = NEW.commitment_id;
            END IF;
        ELSE
            -- Same commitment, just value changed
            IF NEW.commitment_id IS NOT NULL THEN
                UPDATE utility_commitments
                SET balance = balance + OLD.value - NEW.value
                WHERE id = NEW.commitment_id;
            END IF;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.commitment_id IS NOT NULL THEN
            UPDATE utility_commitments
            SET balance = balance + OLD.value
            WHERE id = OLD.commitment_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger for utility_bills (idempotent)
DROP TRIGGER IF EXISTS tr_update_utility_balance ON utility_bills;
CREATE TRIGGER tr_update_utility_balance
AFTER INSERT OR UPDATE OR DELETE ON utility_bills
FOR EACH ROW EXECUTE FUNCTION update_utility_commitment_balance();
