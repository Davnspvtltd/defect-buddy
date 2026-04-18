-- Master dropdown values
CREATE TABLE public.masters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, name)
);
CREATE INDEX idx_masters_kind ON public.masters(kind);

-- Components per system (with codes)
CREATE TABLE public.system_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_name TEXT NOT NULL,
  component_name TEXT NOT NULL,
  component_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (system_name, component_name)
);
CREATE INDEX idx_sc_system ON public.system_components(system_name);

-- Related components per system+component
CREATE TABLE public.related_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_name TEXT NOT NULL,
  component_name TEXT NOT NULL,
  related_name TEXT NOT NULL,
  related_code TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (system_name, component_name, related_name)
);
CREATE INDEX idx_rc_lookup ON public.related_components(system_name, component_name);

-- Smart suggestions per component
CREATE TABLE public.component_suggestions (
  component_name TEXT PRIMARY KEY,
  top_issues TEXT[] NOT NULL DEFAULT '{}',
  top_failures TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Submitted defects
CREATE TABLE public.defect_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  vin TEXT,
  model TEXT,
  shop TEXT,
  location TEXT,
  zone TEXT,
  sub_zone TEXT,
  system TEXT,
  sub_system TEXT,
  component TEXT,
  related_component TEXT,
  issue_type TEXT,
  failure_mode TEXT,
  condition TEXT,
  symptom TEXT,
  description_auto TEXT,
  parent_code TEXT,
  child_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_defect_child_code ON public.defect_entries(child_code);
CREATE INDEX idx_defect_component ON public.defect_entries(component);
CREATE INDEX idx_defect_created_at ON public.defect_entries(created_at DESC);

-- Enable RLS
ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defect_entries ENABLE ROW LEVEL SECURITY;

-- Public read on master/lookup tables
CREATE POLICY "public read masters" ON public.masters FOR SELECT USING (true);
CREATE POLICY "public read system_components" ON public.system_components FOR SELECT USING (true);
CREATE POLICY "public read related_components" ON public.related_components FOR SELECT USING (true);
CREATE POLICY "public read component_suggestions" ON public.component_suggestions FOR SELECT USING (true);

-- Defect entries: anyone can read & insert (internal plant tool, no auth in v1)
CREATE POLICY "public read defect_entries" ON public.defect_entries FOR SELECT USING (true);
CREATE POLICY "public insert defect_entries" ON public.defect_entries FOR INSERT WITH CHECK (true);