import { createClient } from "@supabase/supabase-js";

// Log environment variables for debugging
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY exists:",
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY exists:",
  !!process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Supabase client without fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Additional debug logs right before client creation
console.log("Creating public Supabase client with URL:", supabaseUrl);
console.log("Anon key length:", supabaseAnonKey?.length || 0);

// Public client (for client-side operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("Creating admin Supabase client with URL:", supabaseUrl);
console.log("Service key length:", supabaseServiceKey?.length || 0);

// Admin client with service role key (for server-side operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Persona type definition
interface Persona {
  id?: string;
  name: string;
  description: string;
  systemPrompt?: string;
  created_at?: string;
  updated_at?: string;
}

// Conversation type definition
interface Conversation {
  id?: string;
  user_id: string;
  persona_id: string;
  created_at?: string;
}

// Message type definition
interface Message {
  id?: string;
  conversation_id: string;
  content: string;
  role: "user" | "assistant";
  created_at?: string;
}

/**
 * Creates a new Persona.
 * @param persona - Persona data to create
 * @returns ID of the created Persona
 */
export async function createPersona(
  persona: Omit<Persona, "id" | "created_at" | "updated_at">
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("personas")
      .insert([persona])
      .select("id")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to create Persona");

    return data.id;
  } catch (error) {
    console.error("Error creating Persona:", error);
    throw error;
  }
}

/**
 * Updates an existing Persona.
 * @param id - ID of the Persona to update
 * @param updates - Data to update
 * @returns Success status
 */
export async function updatePersona(
  id: string,
  updates: Partial<Omit<Persona, "id" | "created_at" | "updated_at">>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("personas")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating Persona:", error);
    throw error;
  }
}

/**
 * Deletes a Persona.
 * @param id - ID of the Persona to delete
 * @returns Success status
 */
export async function deletePersona(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("personas").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting Persona:", error);
    throw error;
  }
}

/**
 * Gets or creates a conversation for a user and persona.
 * @param userId - User ID
 * @param personaId - Persona ID
 * @returns Conversation ID
 */
export async function getOrCreateConversation(
  userId: string,
  personaId: string
): Promise<string> {
  try {
    console.log(
      `Getting or creating conversation for user ${userId} with persona ${personaId}`
    );

    // 먼저 userId가 auth.users 테이블에 존재하는지 확인
    const { data: userExists, error: userCheckError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (userCheckError || !userExists) {
      console.error(
        "User does not exist in auth.users:",
        userCheckError || "No user found"
      );
      throw new Error(`User ID ${userId} does not exist in auth.users table`);
    }

    // Try to find an existing conversation
    const { data: existingConversation, error: fetchError } =
      await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("persona_id", personaId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    // If a conversation exists, return its ID
    if (existingConversation && !fetchError) {
      console.log(`Found existing conversation: ${existingConversation.id}`);
      return existingConversation.id;
    }

    // Otherwise create a new conversation
    const { data: newConversation, error: insertError } = await supabaseAdmin
      .from("conversations")
      .insert([{ user_id: userId, persona_id: personaId }])
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting conversation:", insertError);
      throw insertError;
    }

    if (!newConversation) {
      throw new Error("Failed to create conversation - no data returned");
    }

    console.log(`Created new conversation: ${newConversation.id}`);
    return newConversation.id;
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error);
    throw error;
  }
}

/**
 * Saves a message to the database.
 * @param conversationId - Conversation ID
 * @param content - Message content
 * @param role - Message role (user or assistant)
 * @returns ID of the saved message
 */
export async function saveMessage(
  conversationId: string,
  content: string,
  role: "user" | "assistant"
): Promise<string> {
  try {
    // 저장 전 conversation_id가 유효한지 확인
    const { data: conversationCheck, error: checkError } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .single();

    if (checkError) {
      console.error(
        `Conversation validation failed before message save: ${checkError.message}`
      );
      if (checkError.code === "PGRST116") {
        throw new Error(
          `Conversation with ID ${conversationId} does not exist. Cannot save message.`
        );
      }
      throw checkError;
    }

    if (!conversationCheck) {
      console.error(`No conversation found with ID: ${conversationId}`);
      throw new Error(
        `Conversation with ID ${conversationId} does not exist. Cannot save message.`
      );
    }

    console.log(
      `Verified conversation exists before saving message: ${conversationId}`
    );

    // 메시지 저장
    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          content,
          role,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error(
        `Database error saving message: ${error.code} - ${error.message}`
      );

      // FK 제약 조건 위반 오류를 더 명확하게 처리
      if (error.code === "23503") {
        throw new Error(
          `Foreign key constraint violation: Conversation ID ${conversationId} does not exist in conversations table.`
        );
      }

      throw error;
    }

    if (!data) throw new Error("Failed to save message - no data returned");

    console.log(`Successfully saved message with ID: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
}

/**
 * Gets recent messages for a conversation.
 * @param conversationId - Conversation ID
 * @param limit - Maximum number of messages to retrieve (default: 10)
 * @returns Array of messages
 */
export async function getRecentMessages(
  conversationId: string,
  limit: number = 10
): Promise<Message[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error retrieving recent messages:", error);
    throw error;
  }
}
