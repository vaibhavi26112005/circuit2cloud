
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.admins (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read admins" ON public.admins FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update self" ON public.admins FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_first_admin(_name text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  PERFORM pg_advisory_xact_lock(424242);
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN RETURN false; END IF;
  _email := coalesce(auth.jwt() ->> 'email', '');
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(), 'admin');
  INSERT INTO public.admins(id, email, name) VALUES (auth.uid(), _email, _name) ON CONFLICT (id) DO NOTHING;
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_first_admin(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Event settings (single row)
CREATE TABLE public.event_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  event_name text NOT NULL DEFAULT 'CIRCUIT2CLOUD',
  tagline text NOT NULL DEFAULT 'Diagnose. Design. Build. Prove.',
  description text NOT NULL DEFAULT 'A 2-Day National Hardware Build Challenge where teams diagnose real-world problems, design practical solutions, build them on-site, stress-test them and prove that they work.',
  event_date text,
  venue text,
  registration_deadline text,
  registration_status text NOT NULL DEFAULT 'OPEN' CHECK (registration_status IN ('OPEN','CLOSING SOON','CLOSED')),
  contact_name text,
  contact_phone text,
  contact_email text,
  organization text,
  organizer_name text,
  sponsors text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_settings TO anon, authenticated;
GRANT UPDATE ON public.event_settings TO authenticated;
GRANT ALL ON public.event_settings TO service_role;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.event_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin update settings" ON public.event_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER t_settings_upd BEFORE UPDATE ON public.event_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.event_settings (id) VALUES (1);

-- Announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  type text NOT NULL DEFAULT 'NORMAL' CHECK (type IN ('NORMAL','IMPORTANT')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED')),
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published" ON public.announcements FOR SELECT TO anon, authenticated USING (status = 'PUBLISHED' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin insert ann" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update ann" ON public.announcements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete ann" ON public.announcements FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER t_ann_upd BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Schedule
CREATE TABLE public.schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day int NOT NULL CHECK (day IN (1,2)),
  time text NOT NULL,
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schedule_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_items TO authenticated;
GRANT ALL ON public.schedule_items TO service_role;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read sched" ON public.schedule_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write sched" ON public.schedule_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER t_sched_upd BEFORE UPDATE ON public.schedule_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.schedule_items (day, time, title, sort_order) VALUES
(1,'09:00','Registration, inauguration & rules briefing',1),
(1,'10:00','Patient Files drawn + Teardown Round',2),
(1,'11:30','Diagnosis presentations — 2 minutes per team',3),
(1,'12:30','Lunch + Pharmacy opens',4),
(1,'13:30','Build Sprint 1 + Clinic Doctor Round 1',5),
(1,'17:00','Design Freeze — sketch + schematic + BOM submission',6),
(1,'18:00','Day 1 wrap-up',7),
(2,'09:00','Build Sprint 2 + Clinic Doctor Round 2',1),
(2,'12:00','Hands off + lunch',2),
(2,'13:00','Stress Ward testing',3),
(2,'14:30','Failure Autopsy + final demo — 5 minutes per team',4),
(2,'16:30','Judging + expo walkthrough',5),
(2,'17:30','Prize distribution & closing',6);

-- Judging
CREATE TABLE public.judging_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  points int NOT NULL CHECK (points >= 0 AND points <= 1000),
  description text,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.judging_criteria TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.judging_criteria TO authenticated;
GRANT ALL ON public.judging_criteria TO service_role;
ALTER TABLE public.judging_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read judging" ON public.judging_criteria FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write judging" ON public.judging_criteria FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.judging_criteria (title, points, sort_order) VALUES
('Working solution in the demo',30,1),
('Circuit & mechanical design quality',20,2),
('Problem understanding & diagnosis',15,3),
('Stress Ward performance',10,4),
('Cost & manufacturability',10,5),
('Failure Autopsy & documentation',10,6),
('Presentation',5,7);

-- Awards
CREATE TABLE public.special_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  prize text,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.special_awards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_awards TO authenticated;
GRANT ALL ON public.special_awards TO service_role;
ALTER TABLE public.special_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read awards" ON public.special_awards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write awards" ON public.special_awards FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.special_awards (title, description, sort_order) VALUES
('Best Frugal Build','Smartest use of the Pharmacy budget.',1),
('Best Teardown Reuse','Most inventive reuse of a part from the Teardown Round.',2),
('Most Resilient','Best performance in the Stress Ward.',3),
('People''s Choice','Voted by the expo crowd.',4);

-- Registrations
CREATE SEQUENCE public.team_seq START 1;
CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL UNIQUE,
  team_name text NOT NULL,
  college text NOT NULL,
  department text NOT NULL,
  team_size int NOT NULL CHECK (team_size IN (3,4)),
  leader_name text NOT NULL, leader_email text NOT NULL, leader_phone text NOT NULL,
  leader_department text NOT NULL, leader_year text NOT NULL, leader_student_id text NOT NULL,
  member2_name text, member2_email text, member2_phone text, member2_department text, member2_year text, member2_student_id text,
  member3_name text, member3_email text, member3_phone text, member3_department text, member3_year text, member3_student_id text,
  member4_name text, member4_email text, member4_phone text, member4_department text, member4_year text, member4_student_id text,
  status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','APPROVED','REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reg_leader_email_uq ON public.registrations (lower(leader_email));
CREATE UNIQUE INDEX reg_team_college_uq ON public.registrations (lower(team_name), lower(college));
GRANT SELECT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read reg" ON public.registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update reg" ON public.registrations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete reg" ON public.registrations FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER t_reg_upd BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.submit_registration(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _size int; _tid text; _row public.registrations; _st text; i int; k text;
  email_re text := '^[^@\s]+@[^@\s]+\.[^@\s]+$';
  phone_re text := '^\+?[0-9 \-]{7,20}$';
BEGIN
  SELECT registration_status INTO _st FROM public.event_settings WHERE id = 1;
  IF _st = 'CLOSED' THEN RAISE EXCEPTION 'Registrations are closed.'; END IF;
  _size := (p->>'team_size')::int;
  IF _size NOT IN (3,4) THEN RAISE EXCEPTION 'Team must contain 3–4 members.'; END IF;
  FOREACH k IN ARRAY ARRAY['team_name','college','department','leader_name','leader_email','leader_phone','leader_department','leader_year','leader_student_id'] LOOP
    IF coalesce(trim(p->>k),'') = '' OR char_length(p->>k) > 200 THEN RAISE EXCEPTION 'Invalid or missing field: %', k; END IF;
  END LOOP;
  IF (p->>'leader_email') !~ email_re THEN RAISE EXCEPTION 'Enter a valid email address.'; END IF;
  IF (p->>'leader_phone') !~ phone_re THEN RAISE EXCEPTION 'Enter a valid phone number.'; END IF;
  FOR i IN 2.._size LOOP
    FOREACH k IN ARRAY ARRAY['name','email','phone','department','year','student_id'] LOOP
      IF coalesce(trim(p->>('member'||i||'_'||k)),'') = '' OR char_length(p->>('member'||i||'_'||k)) > 200 THEN
        RAISE EXCEPTION 'Missing member % field: %', i, k; END IF;
    END LOOP;
    IF (p->>('member'||i||'_email')) !~ email_re THEN RAISE EXCEPTION 'Enter a valid email for member %.', i; END IF;
    IF (p->>('member'||i||'_phone')) !~ phone_re THEN RAISE EXCEPTION 'Enter a valid phone for member %.', i; END IF;
  END LOOP;
  _tid := 'C2C-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.team_seq')::text, 3, '0');
  INSERT INTO public.registrations (team_id, team_name, college, department, team_size,
    leader_name, leader_email, leader_phone, leader_department, leader_year, leader_student_id,
    member2_name, member2_email, member2_phone, member2_department, member2_year, member2_student_id,
    member3_name, member3_email, member3_phone, member3_department, member3_year, member3_student_id,
    member4_name, member4_email, member4_phone, member4_department, member4_year, member4_student_id)
  VALUES (_tid, trim(p->>'team_name'), trim(p->>'college'), trim(p->>'department'), _size,
    trim(p->>'leader_name'), lower(trim(p->>'leader_email')), trim(p->>'leader_phone'), trim(p->>'leader_department'), trim(p->>'leader_year'), trim(p->>'leader_student_id'),
    p->>'member2_name', p->>'member2_email', p->>'member2_phone', p->>'member2_department', p->>'member2_year', p->>'member2_student_id',
    p->>'member3_name', p->>'member3_email', p->>'member3_phone', p->>'member3_department', p->>'member3_year', p->>'member3_student_id',
    CASE WHEN _size=4 THEN p->>'member4_name' END, CASE WHEN _size=4 THEN p->>'member4_email' END, CASE WHEN _size=4 THEN p->>'member4_phone' END,
    CASE WHEN _size=4 THEN p->>'member4_department' END, CASE WHEN _size=4 THEN p->>'member4_year' END, CASE WHEN _size=4 THEN p->>'member4_student_id' END)
  RETURNING * INTO _row;
  RETURN jsonb_build_object('team_id', _row.team_id, 'team_name', _row.team_name, 'college', _row.college, 'status', _row.status, 'created_at', _row.created_at);
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'A team with this name/college or leader email is already registered.';
END $$;
GRANT EXECUTE ON FUNCTION public.submit_registration(jsonb) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements, public.event_settings, public.schedule_items, public.judging_criteria, public.special_awards;
