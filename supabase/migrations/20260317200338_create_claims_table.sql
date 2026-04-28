-- Create claims table
CREATE TABLE public.claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ra text NOT NULL,
    stage text,
    status text,
    date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    -- Additional columns used by frontend types
    client_id text,
    causer_name text,
    analyst_id text,
    insurance_id text,
    phone text
);

-- Enable RLS for claims
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Create policies for claims
CREATE POLICY "Public Access Claims" ON public.claims 
FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated Access Claims" ON public.claims 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create attachments table
CREATE TABLE public.attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id uuid REFERENCES public.claims(id) ON DELETE CASCADE,
    file_name text,
    file_type text,
    url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for attachments
CREATE POLICY "Public Access Attachments" ON public.attachments 
FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated Access Attachments" ON public.attachments 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
