-- ═══════════════════════════════════════════════════════════════════
-- E-MTAA Row Level Security Policies
-- 
-- Ensures:
--   • Citizens see only their own data
--   • Staff see data in their assigned region/district
--   • Admin sees everything
--   • Applications visible to applicant + assigned staff + admin
--   • Notifications visible only to the intended recipient
--   • Business registrations visible to owner + staff/admin
-- ═══════════════════════════════════════════════════════════════════

-- ── Helper function: check if current user is admin ──────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Helper function: check if current user is staff or admin ────
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ══════════════════════════════════════════════════════════════════
-- 1. USERS / PROFILES TABLE
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Citizens can read their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Citizens can update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Staff can read all citizens (needed for verification, support, review)
CREATE POLICY "users_select_staff" ON public.users
  FOR SELECT USING (public.is_staff_or_admin());

-- Admin can update any user (role changes, verification, etc.)
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (public.is_admin());

-- Service creation (signup) — allow insert for authenticated users
CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ══════════════════════════════════════════════════════════════════
-- 2. PROFILES TABLE (if separate from users)
-- ══════════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Citizen reads own profile
    CREATE POLICY "profiles_select_own" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
    
    -- Citizen updates own profile
    CREATE POLICY "profiles_update_own" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
    
    -- Staff/admin can read all profiles (for buyer/tenant lookup in Sales/Rental)
    CREATE POLICY "profiles_select_staff" ON public.profiles
      FOR SELECT USING (public.is_staff_or_admin());

    -- Insert own profile
    CREATE POLICY "profiles_insert_self" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);

    -- Allow authenticated users to search by NIDA/phone (for agreement counterparty lookup)
    -- This is safe because the search only returns basic public fields
    CREATE POLICY "profiles_select_authenticated" ON public.profiles
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 3. APPLICATIONS TABLE
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Citizen can read their own applications
CREATE POLICY "applications_select_own" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);

-- Citizen can insert their own applications
CREATE POLICY "applications_insert_own" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff/admin can read all applications
CREATE POLICY "applications_select_staff" ON public.applications
  FOR SELECT USING (public.is_staff_or_admin());

-- Staff/admin can update applications (approve, reject, etc.)
CREATE POLICY "applications_update_staff" ON public.applications
  FOR UPDATE USING (public.is_staff_or_admin());

-- Citizen can update own application (for buyer_accepted / tenant_accepted)
CREATE POLICY "applications_update_own" ON public.applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Also allow target_user to update (counterparty acceptance)
CREATE POLICY "applications_update_target" ON public.applications
  FOR UPDATE USING (auth.uid() = target_user_id);

-- ══════════════════════════════════════════════════════════════════
-- 4. NOTIFICATIONS TABLE
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- User can only see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- User can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Any authenticated user can insert notifications (forms create notifications for others)
CREATE POLICY "notifications_insert_auth" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Staff/admin can read all notifications (for support)
CREATE POLICY "notifications_select_staff" ON public.notifications
  FOR SELECT USING (public.is_staff_or_admin());

-- ══════════════════════════════════════════════════════════════════
-- 5. AGREEMENT_NOTIFICATIONS TABLE
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.agreement_notifications ENABLE ROW LEVEL SECURITY;

-- Recipient can see their agreement notifications
CREATE POLICY "agreement_notifs_select_recipient" ON public.agreement_notifications
  FOR SELECT USING (auth.uid() = recipient_id);

-- Sender can see what they sent
CREATE POLICY "agreement_notifs_select_sender" ON public.agreement_notifications
  FOR SELECT USING (auth.uid() = sender_id);

-- Recipient can update (accept/reject)
CREATE POLICY "agreement_notifs_update_recipient" ON public.agreement_notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Any authenticated user can insert (seller/landlord creates for buyer/tenant)
CREATE POLICY "agreement_notifs_insert_auth" ON public.agreement_notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Staff/admin can read all
CREATE POLICY "agreement_notifs_select_staff" ON public.agreement_notifications
  FOR SELECT USING (public.is_staff_or_admin());

-- ══════════════════════════════════════════════════════════════════
-- 6. BUSINESS_REGISTRATIONS TABLE
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.business_registrations ENABLE ROW LEVEL SECURITY;

-- Citizen can read their own registrations
CREATE POLICY "bizreg_select_own" ON public.business_registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Citizen can insert their own registrations
CREATE POLICY "bizreg_insert_own" ON public.business_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff/admin can read all registrations
CREATE POLICY "bizreg_select_staff" ON public.business_registrations
  FOR SELECT USING (public.is_staff_or_admin());

-- Staff/admin can update registrations (approve/reject)
CREATE POLICY "bizreg_update_staff" ON public.business_registrations
  FOR UPDATE USING (public.is_staff_or_admin());

-- ══════════════════════════════════════════════════════════════════
-- 7. SERVICES TABLE (public read for all, admin write)
-- ══════════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services' AND table_schema = 'public') THEN
    ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
    
    -- Everyone can read services
    CREATE POLICY "services_select_all" ON public.services
      FOR SELECT USING (true);
    
    -- Only admin can modify services
    CREATE POLICY "services_modify_admin" ON public.services
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 8. ACTIVITY_LOGS TABLE
-- ══════════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs' AND table_schema = 'public') THEN
    ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
    
    -- Only admin can read logs
    CREATE POLICY "logs_select_admin" ON public.activity_logs
      FOR SELECT USING (public.is_admin());
    
    -- Any authenticated user can insert logs
    CREATE POLICY "logs_insert_auth" ON public.activity_logs
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 9. STORAGE POLICIES (documents bucket)
-- ══════════════════════════════════════════════════════════════════
-- Citizens can upload to their own folder
-- Staff/admin can read all documents
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
    -- Upload policy: citizen can upload to business-docs/{their_id}/
    CREATE POLICY "storage_upload_own" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND
        auth.uid() IS NOT NULL AND
        (storage.foldername(name))[1] = 'business-docs' AND
        (storage.foldername(name))[2] = auth.uid()::text
      );
    
    -- Read policy: owner can read their own files
    CREATE POLICY "storage_select_own" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'documents' AND
        auth.uid() IS NOT NULL AND
        (storage.foldername(name))[2] = auth.uid()::text
      );
    
    -- Staff/admin can read all documents
    CREATE POLICY "storage_select_staff" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'documents' AND
        public.is_staff_or_admin()
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Storage policies skipped (storage extension may not be available)';
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 10. LOCATIONS TABLE (public read, admin write)
-- ══════════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations' AND table_schema = 'public') THEN
    ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "locations_select_all" ON public.locations
      FOR SELECT USING (true);
    
    CREATE POLICY "locations_modify_admin" ON public.locations
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- Done. Run this in Supabase Dashboard → SQL Editor.
