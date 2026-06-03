-- Firebase Integration — add firebase_uid column to users table
-- This links Firebase Phone Auth users to their Supabase profile

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS firebase_uid TEXT;
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON public.users(firebase_uid) WHERE firebase_uid IS NOT NULL;

-- Allow phone-authenticated users to be looked up by firebase_uid
DO $$ BEGIN
  CREATE POLICY "users_select_by_firebase" ON public.users
    FOR SELECT USING (firebase_uid IS NOT NULL AND firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
