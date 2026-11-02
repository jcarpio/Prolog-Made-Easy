import { neon } from '@neondatabase/serverless';

const LIMIT = 30;
const validId = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{1,79}$/.test(value);
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra
  }
});

// Intentionally read-only until authenticated server-side writes are implemented.
export async function GET(request) {
  const url = new URL(request.url);
  const exerciseId = url.searchParams.get('exercise');
  if (!validId(exerciseId)) return json({ error: 'Invalid exercise ID' }, 400);
  if (!process.env.DATABASE_URL) return json({ error: 'Database is not configured' }, 503);
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [exercise] = await sql`
      SELECT id, title, chapter_path FROM public.pme_exercises WHERE id = ${exerciseId}
    `;
    if (!exercise) return json({ error: 'Unknown exercise' }, 404);
    const [comments, summary] = await Promise.all([
      sql`
        SELECT c.id::text AS id, c.parent_id::text AS parent_id,
               p.nickname, c.content, c.created_at
        FROM public.pme_comments c
        JOIN public.pme_profiles p ON p.user_id = c.user_id
        WHERE c.exercise_id = ${exerciseId} AND c.status = 'published'
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT ${LIMIT}
      `,
      sql`
        SELECT count(*) FILTER (WHERE value = 1)::int AS up,
               count(*) FILTER (WHERE value = -1)::int AS down
        FROM public.pme_votes WHERE exercise_id = ${exerciseId}
      `
    ]);
    return json({ exercise, comments, votes: summary[0] ?? { up: 0, down: 0 }, hasMore: comments.length === LIMIT });
  } catch (err) {
    console.error('Community API GET failed', err);
    return json({ error: 'Unable to load community data' }, 500);
  }
}

// Explicitly reject unauthenticated write attempts. This must NOT be replaced
// by a client-provided userId, nickname or email: verify server-side session first.
export async function POST() {
  return json({ error: 'Sign-in is not yet enabled. Comments and voting are read-only.' }, 401);
}
