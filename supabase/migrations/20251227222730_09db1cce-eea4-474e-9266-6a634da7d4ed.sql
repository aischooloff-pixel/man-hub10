-- 1) Privacy settings on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_avatar boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_name boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_username boolean NOT NULL DEFAULT true;

-- 2) Tighten access: write operations only via backend functions (service role)
-- PROFILES
DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by owner" ON public.profiles;

CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update profiles"
ON public.profiles
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ARTICLES
DROP POLICY IF EXISTS "Authenticated users can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Authors can update own articles" ON public.articles;
DROP POLICY IF EXISTS "Approved articles are viewable by everyone" ON public.articles;

CREATE POLICY "Approved articles are viewable by everyone"
ON public.articles
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Service role can insert articles"
ON public.articles
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update articles"
ON public.articles
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- REPUTATION HISTORY: service role only (client will access via backend function)
DROP POLICY IF EXISTS "Users can view own reputation history" ON public.reputation_history;

CREATE POLICY "Service role only"
ON public.reputation_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
