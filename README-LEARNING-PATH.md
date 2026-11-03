# Prolog Made Easy — guided learning path (first implementation)

This additive update targets the existing static HTML / Vercel / Neon project.
No new platform, environment secret, dependency or automatic deployment is introduced.

## Included

- Three experience profiles: no programming, imperative programming (C/C++/Java/Python/etc.) without Prolog, and previous Prolog experience.
- Linear progression through the five existing chapters, including the chapter-one presentation alternative.
- An “I've finished!” button: self-reported completion unlocks exactly one next chapter. No mastery examination blocks novice learning.
- A progress page at `/progress.html`; completed chapters remain available for review.
- Short cumulative recaps and experience-specific explanations in every chapter, also in Reveal.js presentations.
- Guest progress stored in this browser; signed-in progress stored in Neon and retrieved on other devices.
- On sign-in, the contiguous guest path is merged into account progress, then removed from guest storage. No account JWT is stored by this feature. Account progress is never copied to guest storage.
- Optional Exercism Hello World introduction in chapter two; no external completion verification or automatic points sync.

## Apply to the current repository

The accompanying ZIP contains only new or modified files, with their repository-relative paths. Review the changes against your current checkout; if the repository has changed since the recorded base commit, merge rather than blindly overwrite.

1. Back up the current database using your normal process.
2. Run `social/003_learning_path.sql` in the existing Neon database's SQL editor. It creates one independent table and does not modify community data.
3. Copy/merge the ZIP's files into the repository root. Keep all other files, the existing environment variables, and `vercel.json` unchanged.
4. Run `node --test tests/learning-path.test.js` and `git diff --check`.
5. Deploy with the project's existing manual Vercel procedure (`npx vercel --prod`). Git automatic deployment remains disabled.
6. Open `/progress.html`, choose an experience, finish chapter one and confirm chapter two becomes available. A direct URL to chapter four must show the learning-path gate.
7. Sign in, complete a chapter, then sign in on a second device and confirm the same progress. Also check logout and a second account on a shared browser.

The existing `DATABASE_URL` and server-side Neon Auth JWT validation are reused. Learning does not require choosing a public community nickname. If the migration or authentication fails, the UI reports the error rather than claiming that progress was saved.

## Validation performed

- Node tests: sequential unlocks, rejection of skipped/unknown chapters, repeat completion, malformed local progress, and monotonic merging of device progress.
- JavaScript syntax checks and whitespace validation.
- Browser QA: onboarding, persistence as guest across page navigation, direct URL gate, profile-specific help, completion/unlock, and Reveal.js recap layout.
- Live authenticated/database and cross-device verification require your deployed environment; these have not been run against production.

## Boundaries and next work

This is a pedagogical navigation gate for freely accessible static course material, not an authorization barrier protecting secret content. Disabling JavaScript or modifying browser storage can bypass it. This matches self-reported chapter completion. Never use these records to certify mastery.

Changing experience never unlocks chapters. An evidence-based advanced assessment is not implemented yet; all profiles currently follow the same path. Completion and demonstrated mastery are deliberately not conflated.

The first adaptation consists of targeted explanations alongside the existing chapter text; the complete prose has not been rewritten into three versions. Videos, translated subtitles, systematic exercise-level practice tracking, automatic Exercism integration, badges and a validated advanced assessment remain future work. No placeholder videos or unsupported mastery scores are presented.

The existing Neon authentication configuration is preserved. Auth must allow the site's deployed origin, and the browser must permit the existing auth cookie flow. Progress can be saved locally without registration when signed out, but synced account access needs connectivity. Account saves fail visibly and can be retried; there is no offline account write queue.

The API validates identity server-side and uses parameterized SQL. Updates retain the longest valid contiguous completion path to prevent a stale device from erasing progress. Completion is append-only in this release; there is no reset/delete interface.

## Rollback

Revert the frontend and API changes using Git and redeploy the earlier version. The new table may remain without affecting the earlier application; rollback does not require deleting learner progress.

Base source commit: `8e875e8bda7d8edbaeeca72d7ea0b1e8d2638921`
