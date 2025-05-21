-- Stores individual conversation sessions
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id), -- Link to auth.users
  persona_id UUID NOT NULL, -- Link to the persona being chatted with
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Optional: title, summary, etc.
  -- Index for faster user conversation lookup
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id);

-- Stores each message within a conversation
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), -- 'user' or 'assistant'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Optional: metadata (tokens used, model, latency), vector_embedding
  -- Index for fast retrieval of recent messages
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON messages (conversation_id, created_at DESC);

-- Enable Row Level Security (RLS Policies)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own conversations" ON conversations;
CREATE POLICY "Allow users to manage their own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage messages in their conversations" ON messages;
CREATE POLICY "Allow users to manage messages in their conversations" ON messages
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM conversations WHERE id = messages.conversation_id
    )
  );

-- Stores predefined and user-created persona configurations.
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the persona.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Timestamp when the persona was created.
  user_id UUID REFERENCES auth.users(id), -- Foreign key referencing the user who created the persona (null for predefined personas).
  name TEXT NOT NULL, -- Display name of the persona.
  description TEXT, -- Brief description of the persona's purpose.
  avatar_url TEXT, -- URL for the persona's avatar image.
  system_prompt TEXT NOT NULL, -- The core instruction defining the persona's behavior and characteristics.
  is_predefined BOOLEAN NOT NULL DEFAULT FALSE, -- Flag indicating if the persona is a system-provided default (true) or user-created (false).
  greeting_messages TEXT[],
  personality_traits JSONB,
  core_values_motivations JSONB,
  background_summary TEXT,
  communication_style JSONB,
  emotional_expression_details JSONB,
  knowledge_capabilities_limits JSONB,
  behavioral_guidelines JSONB,
  example_dialogues JSONB,
  tags TEXT[]
);

COMMENT ON TABLE personas IS 'Stores predefined and user-created persona configurations.';
COMMENT ON COLUMN personas.id IS 'Unique identifier for the persona.';
COMMENT ON COLUMN personas.created_at IS 'Timestamp when the persona was created.';
COMMENT ON COLUMN personas.user_id IS 'Foreign key referencing the user who created the persona (null for predefined personas).';
COMMENT ON COLUMN personas.name IS 'Display name of the persona.';
COMMENT ON COLUMN personas.description IS 'Brief description of the persona''s purpose.';
COMMENT ON COLUMN personas.avatar_url IS 'URL for the persona''s avatar image.';
COMMENT ON COLUMN personas.system_prompt IS 'The core instruction defining the persona''s behavior and characteristics.';
COMMENT ON COLUMN personas.is_predefined IS 'Flag indicating if the persona is a system-provided default (true) or user-created (false).';

-- Enable Row Level Security (RLS Policies) for personas table
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own personas" ON personas;
CREATE POLICY "Allow users to manage their own personas" ON personas
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to view predefined personas" ON personas;
CREATE POLICY "Allow users to view predefined personas" ON personas
  FOR SELECT USING (is_predefined = TRUE); 