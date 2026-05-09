CREATE OR REPLACE FUNCTION match_listings (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  institution text
)
RETURNS TABLE (
  id uuid,
  seller_id uuid,
  title text,
  description text,
  condition text,
  price numeric,
  category text,
  image_urls text[],
  status text,
  institution_domain text,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.seller_id,
    l.title,
    l.description,
    l.condition,
    l.price,
    l.category,
    l.image_urls,
    l.status,
    l.institution_domain,
    l.created_at,
    l.updated_at,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM listings l
  WHERE l.institution_domain = institution
    AND l.status = 'active'
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
