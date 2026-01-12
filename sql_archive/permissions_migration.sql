-- Migration to add Granular Permissions to User Profile
-- This allows storing specific module permissions per user, overriding department defaults.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.profiles.permissions IS 'Stores granular module permissions (view/manage) overriding defaults.';
