-- Run this in Supabase → SQL Editor (as a user with postgres privileges).
--
-- Why: The dashboard Table Editor uses the postgres role and BYPASSES RLS, so you see rows.
-- The Next.js app uses the anon key + your login JWT. Postgres treats that as the
-- "authenticated" role. If there is no SELECT policy (or it is too narrow), you get
-- an empty array with HTTP 200 — the app shows "0 documents" with no obvious error.
--
-- 1) Inspect existing policies (optional)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE tablename = 'documents';

-- 2) Allow signed-in users to read rows in public.documents
--    Tighten this later (e.g. join to profiles/properties) for production.
DROP POLICY IF EXISTS "documents_select_authenticated" ON public.documents;

CREATE POLICY "documents_select_authenticated"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (true);

-- If you need the table readable when using only the anon key (not recommended for private data):
-- CREATE POLICY "documents_select_anon_debug"
--   ON public.documents FOR SELECT TO anon USING (true);
