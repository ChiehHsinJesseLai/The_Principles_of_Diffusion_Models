/*
  # Add Likes and Dislikes to Comments

  ## Purpose
  Enable users to react to comments with thumbs up (like) and thumbs down (dislike).

  ## Changes

  ### Modified Tables
  - `comments` table:
    - Added `likes_count` (integer, default 0) - Count of thumbs up
    - Added `dislikes_count` (integer, default 0) - Count of thumbs down

  ### New Tables
  - `comment_reactions`:
    - `id` (uuid, primary key)
    - `comment_id` (uuid) - References the comment
    - `reaction_type` (text) - Either 'like' or 'dislike'
    - `user_fingerprint` (text) - Browser fingerprint to prevent duplicate reactions
    - `created_at` (timestamp)
    - Unique constraint on (comment_id, user_fingerprint) to prevent duplicate votes

  ## Security
  - Enable RLS on comment_reactions table
  - Allow anyone to insert reactions (authenticated or not)
  - Allow anyone to read reactions
  - No updates or deletes allowed (reactions are permanent)

  ## Notes
  - Uses browser fingerprint instead of user ID to allow anonymous reactions
  - Unique constraint ensures one reaction per comment per user
  - Counts are denormalized for performance
*/

-- Add likes and dislikes columns to comments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE comments ADD COLUMN likes_count integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'dislikes_count'
  ) THEN
    ALTER TABLE comments ADD COLUMN dislikes_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  user_fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(comment_id, user_fingerprint)
);

-- Enable RLS on comment_reactions
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'comment_reactions' AND policyname = 'Anyone can read reactions'
  ) THEN
    CREATE POLICY "Anyone can read reactions"
      ON comment_reactions FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'comment_reactions' AND policyname = 'Anyone can add reactions'
  ) THEN
    CREATE POLICY "Anyone can add reactions"
      ON comment_reactions FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_fingerprint ON comment_reactions(comment_id, user_fingerprint);

-- Function to update comment counts when reaction is added
CREATE OR REPLACE FUNCTION update_comment_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reaction_type = 'like' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF NEW.reaction_type = 'dislike' THEN
    UPDATE comments SET dislikes_count = dislikes_count + 1 WHERE id = NEW.comment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update counts
DROP TRIGGER IF EXISTS trigger_update_reaction_count ON comment_reactions;
CREATE TRIGGER trigger_update_reaction_count
  AFTER INSERT ON comment_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reaction_count();
