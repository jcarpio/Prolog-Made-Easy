-- Prolog Made Easy · community schema v1
-- Run once on Neon: Postgres database > SQL Editor (production / neondb).
-- Users are managed later by Neon Better Auth. No anonymous insert privileges are granted.
CREATE TABLE IF NOT EXISTS public.pme_profiles (
  user_id text PRIMARY KEY,
  nickname varchar(32) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pme_nickname_format CHECK (nickname ~ '^[A-Za-z0-9_]{3,32}$')
);

CREATE TABLE IF NOT EXISTS public.pme_exercises (
  id text PRIMARY KEY,
  title text NOT NULL,
  chapter_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pme_exercise_id CHECK (id ~ '^[a-z0-9][a-z0-9-]{1,79}$')
);

CREATE TABLE IF NOT EXISTS public.pme_comments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  exercise_id text NOT NULL REFERENCES public.pme_exercises(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.pme_profiles(user_id) ON DELETE CASCADE,
  parent_id bigint REFERENCES public.pme_comments(id) ON DELETE SET NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pme_comment_length CHECK (char_length(btrim(content)) BETWEEN 3 AND 2000)
);
CREATE INDEX IF NOT EXISTS pme_comments_visible_idx ON public.pme_comments (exercise_id, created_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS pme_comments_user_idx ON public.pme_comments (user_id);

CREATE TABLE IF NOT EXISTS public.pme_votes (
  exercise_id text NOT NULL REFERENCES public.pme_exercises(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.pme_profiles(user_id) ON DELETE CASCADE,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (exercise_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.pme_newsletter_consents (
  user_id text PRIMARY KEY REFERENCES public.pme_profiles(user_id) ON DELETE CASCADE,
  subscribed boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  withdrawn_at timestamptz,
  consent_version text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pme_newsletter_consistency CHECK (NOT subscribed OR consented_at IS NOT NULL)
);

INSERT INTO public.pme_exercises (id, title, chapter_path) VALUES
  ('natural-numbers', 'Natural Numbers — Infinite Possibilities!', '/chapters/04-natural-numbers.html'),
  ('sudoku-logic-way', 'Sudoku, the Logic Way!', '/chapters/05-sudoku-the-logic-way.html')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, chapter_path = EXCLUDED.chapter_path;
