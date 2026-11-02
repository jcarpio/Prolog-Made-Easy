import { neon } from '@neondatabase/serverless';
import { json, requireUser, readBody, errorResponse } from './_lib/security.js';
const sql = () => neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const userId = await requireUser(request);
    const [profile] = await sql()`SELECT p.user_id, p.nickname, p.created_at,
      COALESCE(n.subscribed,false) AS subscribed
      FROM public.pme_profiles p
      LEFT JOIN public.pme_newsletter_consents n ON n.user_id = p.user_id
      WHERE p.user_id = ${userId}`;
    return json({ profile: profile || null });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request) {
  try {
    const userId = await requireUser(request);
    const body = await readBody(request);
    const nickname = String(body.nickname || '').trim();
    if (!/^[A-Za-z0-9_]{3,32}$/.test(nickname)) return json({ error: 'Nickname must be 3–32 letters, numbers or underscores.' }, 400);
    if (typeof body.newsletter !== 'boolean') return json({ error: 'Newsletter preference must be true or false.' }, 400);
    const subscribed = body.newsletter;
    const db = sql();
    // Safe, parameterized statements. A unique index prevents duplicate nicknames.
    const [profile] = await db`INSERT INTO public.pme_profiles (user_id, nickname)
      VALUES (${userId}, ${nickname})
      ON CONFLICT (user_id) DO UPDATE SET nickname=EXCLUDED.nickname, updated_at=now()
      RETURNING user_id, nickname`;
    await db`INSERT INTO public.pme_newsletter_consents
      (user_id, subscribed, consented_at, withdrawn_at, consent_version)
      VALUES (${userId}, ${subscribed}, ${subscribed ? new Date().toISOString() : null},
              ${null}, 'v1-2026-11')
      ON CONFLICT (user_id) DO UPDATE SET
        subscribed=EXCLUDED.subscribed,
        consented_at=CASE WHEN EXCLUDED.subscribed AND NOT public.pme_newsletter_consents.subscribed
                    THEN now() ELSE public.pme_newsletter_consents.consented_at END,
        withdrawn_at=CASE WHEN NOT EXCLUDED.subscribed AND public.pme_newsletter_consents.subscribed
                    THEN now() ELSE public.pme_newsletter_consents.withdrawn_at END,
        consent_version=EXCLUDED.consent_version, updated_at=now()`;
    return json({ profile: { ...profile, subscribed } });
  } catch (error) { return errorResponse(error); }
}
