-- Indexes for the queries the app runs most. No data changes.

-- Public feed: WHERE is_public = 1 AND status <> 'SOLD' ORDER BY created_at DESC, id DESC.
-- Read backwards, this index returns public posts newest first, so MySQL stops
-- after one page instead of sorting the whole table.
CREATE INDEX idx_posts_feed ON posts (is_public, created_at, id);

-- A reader's own listings and public profile, newest first.
CREATE INDEX idx_posts_owner ON posts (user_id, created_at, id);

-- Unread counts look up each participant's latest message per conversation.
CREATE INDEX idx_messages_conversation_user ON messages (conversation_id, user_id);
