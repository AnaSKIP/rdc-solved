-- Enable Row Level Security and create policies for anonymous users (public access)
-- for all contact-related tables.

-- Table analysts
CREATE POLICY "Public Access Analysts" ON public.analysts 
FOR ALL TO anon USING (true) WITH CHECK (true);

-- Table clients
CREATE POLICY "Public Access Clients" ON public.clients 
FOR ALL TO anon USING (true) WITH CHECK (true);

-- Table insurers
CREATE POLICY "Public Access Insurers" ON public.insurers 
FOR ALL TO anon USING (true) WITH CHECK (true);

-- Table internal_team
CREATE POLICY "Public Access Internal Team" ON public.internal_team 
FOR ALL TO anon USING (true) WITH CHECK (true);
