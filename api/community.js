import { neon } from '@neondatabase/serverless';
import { json, validExercise, requireUser, readBody, errorResponse } from './_lib/security.js';
const LIMIT = 30;
const sql = () => neon(process.env.DATABASE_URL);
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const exerciseId = url.searchParams.get('exercise');
    if (!validExercise(exerciseId)) return json({ error: 'Invalid exercise ID' }, 400);
    const db = sql();
    const [exercise] = await db`SELECT id, title, chapter_path FROM public.pme_exercises WHERE id=${exerciseId}`;
    if (!exercise) return json({ error: 'Unknown exercise' }, 404);
    const [comments, votes] = await Promise.all([
      db`SELECT c.id::text AS id, c.parent_id::text AS parent_id, p.nickname,
         c.content, c.created_at
         FROM public.pme_comments c JOIN public.pme_profiles p ON p.user_id=c.user_id
         WHERE c.exercise_id=${exerciseId} AND c.status='published'
         ORDER BY c.created_at DESC, c.id DESC LIMIT ${LIMIT}`,
      db`SELECT count(*) FILTER (WHERE value=1)::int AS up,
                 count(*) FILTER (WHERE value=-1)::int AS down
         FROM public.pme_votes WHERE exercise_id=${exerciseId}`
    ]);
    return json({ exercise, comments, votes: votes[0] || { up: 0, down: 0 }, hasMore: comments.length === LIMIT });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request) {
  try {
    const userId = await requireUser(request);
    const data = await readBody(request);
    const exerciseId = data.exerciseId;
    if (!validExercise(exerciseId)) return json({ error: 'Invalid exercise ID' }, 400);
    const db = sql();
    const [profile] = await db`SELECT user_id FROM public.pme_profiles WHERE user_id=${userId}`;
    if (!profile) return json({ error: 'Complete your nickname first.', needsProfile: true }, 409);
    if (data.action === 'vote') {
      if (![1, -1, 0].includes(data.value) || typeof data.value !== 'number') return json({ error: 'Invalid vote' }, 400);
      if (data.value === 0) await db`DELETE FROM public.pme_votes WHERE exercise_id=${exerciseId} AND user_id=${userId}`;
      else await db`INSERT INTO public.pme_votes (exercise_id, user_id, value)
        VALUES (${exerciseId},${userId},${data.value})
        ON CONFLICT (exercise_id,user_id) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`;
      return json({ ok: true });
    }
    if (data.action === 'comment') {
      const content = String(data.content || '').trim();
      if (content.length < 3 || content.length > 2000) return json({ error: 'Comment must be between 3 and 2000 characters.' }, 400);
      const parentId = data.parentId == null ? null : String(data.parentId);
      if (parentId !== null && !/^[1-9][0-9]{0,17}$/.test(parentId)) return json({ error: 'Invalid parent' }, 400);
      // One new comment per minute and valid parent in same exercise.
      const [inserted] = await db`INSERT INTO public.pme_comments
         (exercise_id, user_id, parent_id, content, status)
         SELECT e.id, ${userId}, ${parentId}::bigint, ${content}, 'pending'
         FROM public.pme_exercises e
         WHERE e.id=${exerciseId}
           AND (${parentId}::bigint IS NULL OR EXISTS (
             SELECT 1 FROM public.pme_comments p WHERE p.id=${parentId}::bigint
             AND p.exercise_id=e.id AND p.status='published'))
           AND NOT EXISTS (
             SELECT 1 FROM public.pme_comments recent WHERE recent.user_id=${userId}
             AND recent.created_at > now()-interval '60 seconds')
         RETURNING id::text AS id`;
      if (!inserted) return json({ error: 'Wait a minute between comments, or check the parent/exercise.' }, 429);
      return json({ ok: true, status: 'pending', id: inserted.id }, 201);
    }
    return json({ error: 'Unknown action' }, 400);
  } catch (error) { return errorResponse(error); }
}
