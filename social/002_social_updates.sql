-- Optional indexes for a growing moderated community. Existing schema 001 remains unchanged.
CREATE INDEX IF NOT EXISTS pme_comments_recent_author_idx ON public.pme_comments(user_id, created_at DESC);
-- Note: pme_newsletter_consents contains consent records only; no actual emails are sent by this release.
