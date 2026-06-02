-- E-Mtaa schema (from cloned repo 01_final_schema.sql)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('citizen', 'staff', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE application_status AS ENUM ('submitted','pending_review','pending_payment','paid','verified','approved','issued','returned','rejected','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE business_type AS ENUM ('seller','landlord','broker'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE business_registration_status AS ENUM ('pending','approved','rejected','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE client_relationship_type AS ENUM ('tenant','buyer','renter'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE client_relationship_status AS ENUM ('active','inactive','pending','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender TEXT, sex TEXT, date_of_birth DATE, place_of_birth TEXT,
  marital_status TEXT CHECK (marital_status IN ('single','married','divorced','widowed')),
  occupation TEXT,
  education_level TEXT CHECK (education_level IN ('none','primary','secondary','diploma','degree','masters','phd')),
  nationality TEXT DEFAULT 'Tanzanian',
  country_of_citizenship TEXT DEFAULT 'Tanzania',
  nida_number TEXT UNIQUE, id_type TEXT, id_number TEXT,
  passport_number TEXT, voter_id_number TEXT, driving_license_number TEXT,
  phone TEXT, alternative_phone TEXT,
  email TEXT UNIQUE NOT NULL,
  email_address TEXT, alternative_email TEXT, photo_url TEXT,
  role user_role DEFAULT 'citizen',
  is_verified BOOLEAN DEFAULT FALSE,
  is_diaspora BOOLEAN DEFAULT FALSE,
  country_of_residence TEXT, city_of_residence TEXT,
  diaspora_region TEXT, diaspora_district TEXT, diaspora_ward TEXT,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active','suspended','pending')),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  region TEXT, district TEXT, ward TEXT, street TEXT,
  house_number TEXT, postal_code TEXT, landmark TEXT,
  birth_region TEXT, birth_district TEXT,
  emergency_contact_name TEXT, emergency_contact_phone TEXT, emergency_contact_relation TEXT,
  office_id UUID, assigned_region TEXT, assigned_district TEXT,
  employee_id TEXT, department TEXT, position TEXT, employment_date DATE,
  citizen_id TEXT UNIQUE, seller_id TEXT, landlord_id TEXT, broker_id TEXT,
  blood_group TEXT CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  disability_status TEXT CHECK (disability_status IN ('none','physical','visual','hearing','speech','multiple')),
  religious_affiliation TEXT, tribe TEXT,
  mtaa_executive_officer TEXT, ward_councillor TEXT, ward_chairperson TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL, name_en TEXT, description TEXT,
  form_schema JSONB NOT NULL, diaspora_form_schema JSONB, document_template JSONB,
  fee DECIMAL(12,2) DEFAULT 0, active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT CHECK (level IN ('region','district','ward','street')) NOT NULL,
  parent_id UUID REFERENCES public.locations(id),
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, code TEXT UNIQUE,
  region TEXT, district TEXT, ward TEXT, street TEXT,
  phone TEXT, email TEXT, address TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, name_sw TEXT, description TEXT, icon TEXT,
  "order" INTEGER DEFAULT 0, active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT,
  form_data JSONB NOT NULL,
  status application_status DEFAULT 'submitted',
  application_number TEXT UNIQUE,
  region TEXT, district TEXT, ward TEXT, street TEXT,
  location_id UUID REFERENCES public.locations(id),
  assigned_staff_id UUID REFERENCES public.users(id),
  assigned_office_id UUID,
  second_party_user_id UUID REFERENCES public.users(id),
  second_party_citizen_id TEXT,
  second_party_accepted BOOLEAN DEFAULT FALSE,
  second_party_accepted_at TIMESTAMPTZ,
  target_user_id UUID REFERENCES public.users(id),
  target_user_nida TEXT, target_user_role TEXT,
  agreement_status TEXT DEFAULT 'pending' CHECK (agreement_status IN ('pending','approved','rejected','expired')),
  approved_by_target UUID REFERENCES public.users(id),
  approved_by_target_at TIMESTAMPTZ,
  target_rejection_reason TEXT,
  confirmation_data JSONB,
  is_confirmed BOOLEAN DEFAULT FALSE,
  payment_data JSONB,
  approved_by UUID REFERENCES public.users(id), approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES public.users(id), rejected_at TIMESTAMPTZ,
  returned_by UUID REFERENCES public.users(id), returned_at TIMESTAMPTZ,
  issued_by UUID REFERENCES public.users(id), issued_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id), verified_at TIMESTAMPTZ,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL, currency TEXT DEFAULT 'TZS',
  payment_method TEXT, transaction_id TEXT UNIQUE, receipt_number TEXT UNIQUE,
  breakdown JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) NOT NULL,
  document_url TEXT NOT NULL, qr_code_url TEXT,
  certificate_id TEXT UNIQUE,
  issue_date DATE DEFAULT CURRENT_DATE, expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_type business_type NOT NULL,
  business_id VARCHAR(20) UNIQUE,
  business_name VARCHAR(255), description TEXT,
  experience_years INTEGER DEFAULT 0, specialization VARCHAR(255),
  region VARCHAR(100), district VARCHAR(100), ward VARCHAR(100), street VARCHAR(255),
  phone VARCHAR(20), alt_phone VARCHAR(20), email VARCHAR(255),
  id_document_url TEXT, proof_document_url TEXT, photo_url TEXT,
  status business_registration_status DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id), reviewed_at TIMESTAMPTZ, approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_business_id VARCHAR(20), owner_business_type VARCHAR(20),
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_citizen_id VARCHAR(20),
  relationship_type client_relationship_type NOT NULL,
  property_type VARCHAR(100), property_description TEXT, property_address TEXT,
  property_region VARCHAR(100), property_district VARCHAR(100), property_ward VARCHAR(100),
  agreement_id UUID, agreement_number VARCHAR(50),
  monthly_rent DECIMAL(15,2), total_price DECIMAL(15,2), deposit_amount DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'TZS',
  start_date DATE NOT NULL, end_date DATE, last_payment_date DATE, next_payment_due DATE,
  status client_relationship_status DEFAULT 'active', status_reason TEXT,
  client_name VARCHAR(255), client_phone VARCHAR(20), client_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profile_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL, old_value TEXT, new_value TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id), reviewed_at TIMESTAMPTZ, rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, message TEXT, type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agreement_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_citizen_id TEXT,
  notification_type TEXT DEFAULT 'agreement_approval',
  message TEXT, is_read BOOLEAN DEFAULT FALSE, is_actioned BOOLEAN DEFAULT FALSE,
  action_taken TEXT, action_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), actioned_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_category TEXT NOT NULL DEFAULT 'support',
  document_name TEXT NOT NULL, document_url TEXT NOT NULL,
  file_type TEXT, file_size INTEGER,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES public.users(id), verified_at TIMESTAMPTZ,
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255), description TEXT,
  location_id UUID REFERENCES public.locations(id),
  start_date DATE, end_date DATE, start_time TIME, end_time TIME,
  capacity INTEGER, registered_count INTEGER DEFAULT 0, active BOOLEAN DEFAULT TRUE,
  ip_address TEXT, user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL, details JSONB, ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper functions (security definer)
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role::TEXT FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.get_user_role_safe() IN ('staff','admin'), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.get_user_role_safe() = 'admin', FALSE);
$$;

-- Get user profile (used by Sidebar RPC)
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID, email TEXT, first_name TEXT, last_name TEXT,
  role TEXT, is_verified BOOLEAN, account_status TEXT,
  region TEXT, district TEXT, ward TEXT, street TEXT
) LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, u.email, u.first_name, u.last_name,
         u.role::TEXT, u.is_verified, u.account_status,
         u.region, u.district, u.ward, u.street
  FROM public.users u WHERE u.id = user_id;
$$;

CREATE SEQUENCE IF NOT EXISTS public.citizen_id_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_citizen_id()
RETURNS TEXT AS $$
DECLARE year_part TEXT; letter_part TEXT; number_part TEXT; new_citizen_id TEXT; counter INT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  counter := COALESCE(NEXTVAL('public.citizen_id_seq'), 1);
  letter_part := CHR(65 + ((counter - 1) / 999999) % 26);
  number_part := LPAD(((counter - 1) % 999999 + 1)::TEXT, 5, '0');
  new_citizen_id := 'CT' || year_part || letter_part || number_part;
  RETURN new_citizen_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_citizen_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.citizen_id IS NULL THEN NEW.citizen_id := public.generate_citizen_id(); END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_citizen_id ON public.users;
CREATE TRIGGER trigger_set_citizen_id BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_citizen_id();

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trigger_applications_updated_at ON public.applications;
CREATE TRIGGER trigger_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'citizen')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grants (PostgREST requires explicit grants in public schema)
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT SELECT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_documents TO authenticated;
GRANT SELECT ON public.generated_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_relationships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_change_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agreement_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT SELECT ON public.locations TO authenticated, anon;
GRANT SELECT ON public.offices TO authenticated, anon;
GRANT SELECT ON public.service_categories TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff can view all users" ON public.users FOR SELECT USING (public.is_admin_or_staff());
CREATE POLICY "Staff can update users" ON public.users FOR UPDATE USING (public.is_admin_or_staff());
CREATE POLICY "Admin can delete users" ON public.users FOR DELETE USING (public.is_admin());

CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (active = true);
CREATE POLICY "Staff can manage services" ON public.services FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Citizens can view own applications" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Citizens can insert own applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Citizens can update own applications" ON public.applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Second party can view applications" ON public.applications FOR SELECT USING (second_party_user_id = auth.uid() OR target_user_id = auth.uid());
CREATE POLICY "Staff can view all applications" ON public.applications FOR SELECT USING (public.is_admin_or_staff());
CREATE POLICY "Staff can update applications" ON public.applications FOR UPDATE USING (public.is_admin_or_staff());
CREATE POLICY "Public can verify issued applications" ON public.applications FOR SELECT USING (status = 'issued');

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = payments.application_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.applications WHERE id = payments.application_id AND user_id = auth.uid())
);
CREATE POLICY "Staff can view all payments" ON public.payments FOR SELECT USING (public.is_admin_or_staff());

CREATE POLICY "Anyone can view generated documents" ON public.generated_documents FOR SELECT USING (true);
CREATE POLICY "Staff can manage generated documents" ON public.generated_documents FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Users can view own registrations" ON public.business_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own registrations" ON public.business_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can manage registrations" ON public.business_registrations FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Owners can view own relationships" ON public.client_relationships FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Clients can view own relationships" ON public.client_relationships FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Owners can insert relationships" ON public.client_relationships FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update relationships" ON public.client_relationships FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can view own change requests" ON public.profile_change_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert change requests" ON public.profile_change_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can manage profile change requests" ON public.profile_change_requests FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own agreement notifications" ON public.agreement_notifications FOR SELECT USING (recipient_id = auth.uid() OR sender_id = auth.uid());
CREATE POLICY "Users can insert agreement notifications" ON public.agreement_notifications FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Recipients can update agreement notifications" ON public.agreement_notifications FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "Users can view own documents" ON public.user_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload own documents" ON public.user_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.user_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all documents" ON public.user_documents FOR SELECT USING (public.is_admin_or_staff());

CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activity" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all activity" ON public.activity_logs FOR SELECT USING (public.is_admin_or_staff());
CREATE POLICY "System can insert activity" ON public.activity_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Staff can manage locations" ON public.locations FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Anyone can view offices" ON public.offices FOR SELECT USING (true);
CREATE POLICY "Staff can manage offices" ON public.offices FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Anyone can view service categories" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Staff can manage service categories" ON public.service_categories FOR ALL USING (public.is_admin_or_staff());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_nida ON public.users(nida_number) WHERE nida_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_application_number ON public.applications(application_number);
CREATE INDEX IF NOT EXISTS idx_payments_application_id ON public.payments(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);