-- Core tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    institution_domain TEXT NOT NULL,    -- extracted from email
    display_name TEXT,
    avatar_url TEXT,
    trust_score NUMERIC(4,2) DEFAULT 0.00,
    trust_badge TEXT DEFAULT 'New',      -- New / Verified / Trusted / Flagged
    account_created_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    condition TEXT CHECK (condition IN ('Like New','Good','Fair','For Parts')),
    price NUMERIC(10,2) NOT NULL,
    category TEXT,
    image_urls TEXT[],                   -- Cloudinary URLs
    status TEXT DEFAULT 'active',        -- active / sold / expired
    institution_domain TEXT NOT NULL,    -- scoped visibility
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id),
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'interested',    -- interested -> confirmed -> meetup -> completed / disputed
    buyer_condition_rating TEXT,         -- buyer rates actual condition
    dispute_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE wants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    max_budget NUMERIC(10,2),
    institution_domain TEXT NOT NULL,
    status TEXT DEFAULT 'open',          -- open / fulfilled / expired
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
    created_at TIMESTAMPTZ DEFAULT now()
);
