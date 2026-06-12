-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,           -- 'want_match', 'transaction_update', 'surge_alert'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own notifications
CREATE POLICY "notifications_owner_select" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Policy to allow users to update (e.g. mark as read) only their own notifications
CREATE POLICY "notifications_owner_update" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- PostgreSQL function to perform vector similarity matching on the wants table
CREATE OR REPLACE FUNCTION public.match_wants (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  institution text
)
RETURNS TABLE (
  id uuid,
  buyer_id uuid,
  title text,
  description text,
  max_budget numeric,
  institution_domain text,
  status text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.buyer_id,
    w.title,
    w.description,
    w.max_budget,
    w.institution_domain,
    w.status,
    w.created_at,
    1 - (w.embedding <=> query_embedding) AS similarity
  FROM public.wants w
  WHERE w.institution_domain = institution
    AND w.status = 'open'
    AND 1 - (w.embedding <=> query_embedding) > match_threshold
  ORDER BY w.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
