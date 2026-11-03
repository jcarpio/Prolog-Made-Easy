-- Run in the existing Neon database before deploying the learning path API.
-- Independent of community nicknames: learning does not require a public profile.
CREATE TABLE IF NOT EXISTS public.pme_learning (
  user_id text PRIMARY KEY,
  experience text NOT NULL CHECK (experience IN ('beginner','imperative','prolog')),
  completed jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(completed) = 'array'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Access only through the authenticated server API. No public database grants.
