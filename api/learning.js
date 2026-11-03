import { neon } from '@neondatabase/serverless';
import { json, requireUser, readBody, errorResponse } from './_lib/security.js';
import { experiences, prefix, complete, mergeProgress } from '../assets/js/course-model.js';

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const db = neon(process.env.DATABASE_URL);
    const [row] = await db`SELECT experience, completed FROM public.pme_learning WHERE user_id=${user}`;
    return json({ learning: row ? { experience: row.experience, completed: prefix(row.completed) } : null });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request) {
  try {
    const user = await requireUser(request);
    const body = await readBody(request);
    if (!body || !experiences.includes(body.experience) || !['profile','complete','import'].includes(body.action))
      return json({ error: 'Invalid learning preference or action.' }, 400);
    const db = neon(process.env.DATABASE_URL);
    const [row] = await db`SELECT experience, completed FROM public.pme_learning WHERE user_id=${user}`;
    let completed = prefix(row?.completed);
    if (body.action === 'complete') {
      try { completed = complete(completed, body.chapter); }
      catch { return json({ error: 'Finish the previous chapter first.' }, 409); }
    }
    if (body.action === 'import') {
      // Completion is self-reported, like the "I've finished" button. Only import a contiguous path.
      if (!Array.isArray(body.completed) || body.completed.length > 5 ||
          prefix(body.completed).length !== body.completed.length)
        return json({ error: 'Invalid guest progress.' }, 400);
      completed = mergeProgress(completed, body.completed);
    }
    // Concurrent tabs/devices may add progress; they must never erase it.
    const [saved] = await db`INSERT INTO public.pme_learning (user_id,experience,completed)
      VALUES (${user},${body.experience},${JSON.stringify(completed)}::jsonb)
      ON CONFLICT (user_id) DO UPDATE SET experience=EXCLUDED.experience,
        completed=CASE WHEN jsonb_array_length(public.pme_learning.completed)>jsonb_array_length(EXCLUDED.completed)
          THEN public.pme_learning.completed ELSE EXCLUDED.completed END, updated_at=now()
      RETURNING experience,completed`;
    return json({ learning: saved });
  } catch (error) { return errorResponse(error); }
}
