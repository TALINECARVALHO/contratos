ALTER TABLE purchase_requests ADD COLUMN "requester_id" uuid REFERENCES profiles(id);
