-- Create utility_commitments table
CREATE TABLE IF NOT EXISTS utility_commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('water', 'light')),
    department TEXT NOT NULL,
    consumer_unit TEXT NOT NULL,
    total_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add commitment_id to utility_bills
ALTER TABLE utility_bills ADD COLUMN IF NOT EXISTS commitment_id UUID REFERENCES utility_commitments(id);

-- Function to update commitment balance
CREATE OR REPLACE FUNCTION update_utility_commitment_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE utility_commitments
        SET balance = balance - NEW.value
        WHERE id = NEW.commitment_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE utility_commitments
        SET balance = balance + OLD.value - NEW.value
        WHERE id = NEW.commitment_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE utility_commitments
        SET balance = balance + OLD.value
        WHERE id = OLD.commitment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for utility_bills
DROP TRIGGER IF EXISTS tr_update_utility_balance ON utility_bills;
CREATE TRIGGER tr_update_utility_balance
AFTER INSERT OR UPDATE OR DELETE ON utility_bills
FOR EACH ROW EXECUTE FUNCTION update_utility_commitment_balance();
