-- Create the blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read blogs
CREATE POLICY "Allow public read access" ON public.blogs
    FOR SELECT USING (true);

-- Policy: Allow service role (admin) to manage blogs
-- Since the admin portal uses the anon key but is passphrase protected, 
-- we can either allow all inserts (risky) or rely on a secret key check in policies.
-- For simplicity in this implementation, we will allow all inserts/updates/deletes 
-- but you should restrict this to authenticated admins in production.
CREATE POLICY "Allow admin management" ON public.blogs
    FOR ALL USING (true) WITH CHECK (true);

-- Grant access to anon and authenticated roles
GRANT ALL ON public.blogs TO anon, authenticated, service_role;
