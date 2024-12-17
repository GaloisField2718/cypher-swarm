CREATE TABLE threads (
  id BIGSERIAL PRIMARY KEY,
  tweet_id TEXT NOT NULL,
  tweet_ids TEXT[] NOT NULL,
  content JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'publishing', 'published', 'failed')),
  bot_username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_threads_tweet_id ON threads(tweet_id);
CREATE INDEX idx_threads_status ON threads(status); 