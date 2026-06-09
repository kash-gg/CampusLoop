-- Create surge status table to track campus-specific listing frequency surges
CREATE TABLE IF NOT EXISTS public.surge_status (
    institution_domain TEXT PRIMARY KEY,
    is_surge BOOLEAN DEFAULT false,
    today_count INT DEFAULT 0,
    avg_count NUMERIC(10,2) DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surge_status ENABLE ROW LEVEL SECURITY;

-- Allow public read access to surge status
CREATE POLICY "surge_status_select" ON public.surge_status
    FOR SELECT USING (true);
