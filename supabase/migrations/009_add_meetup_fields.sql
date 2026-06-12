-- Migration to add meetup location and time to the transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS meetup_location TEXT,
ADD COLUMN IF NOT EXISTS meetup_time TIMESTAMPTZ;
