CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE listings ADD COLUMN embedding vector(384);
ALTER TABLE wants ADD COLUMN embedding vector(384);

CREATE INDEX ON listings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON wants USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
