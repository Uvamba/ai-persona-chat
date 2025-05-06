-- Stores individual conversation sessions
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Link to auth.users when auth is implemented
  persona_id UUID NOT NULL, -- Link to the persona being chatted with
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Optional: title, summary, etc.
  INDEX idx_conversations_user_id (user_id) -- Index for faster user conversation lookup
);

-- Stores each message within a conversation
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), -- 'user' or 'assistant'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Optional: metadata (tokens used, model, latency), vector_embedding
  INDEX idx_messages_conversation_id_created_at (conversation_id, created_at DESC) -- Index for fast retrieval of recent messages
);

-- Enable Row Level Security (RLS Policies)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage messages in their conversations" ON messages
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM conversations WHERE id = messages.conversation_id
    )
  ); 