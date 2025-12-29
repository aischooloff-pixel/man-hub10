-- Add topic field to articles and remove minimum character constraint concept
-- The topic is a short description/keywords for the article
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS topic text;

-- Add sources column to store article sources
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS sources text[];

-- Add pending_edit column to track pending edits 
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS pending_edit jsonb;

-- Add edited_at column to track when article was last edited
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;