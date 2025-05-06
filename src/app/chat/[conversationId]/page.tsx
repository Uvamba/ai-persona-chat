// Remove "use client"; to make it a Server Component
import React from "react";
// Remove client-side hooks: useState, useEffect, useRef, useCallback, useParams

// Keep necessary imports for server-side logic and component rendering
import { Persona } from "@/lib/types";
import ChatClient from "@/components/chat-client"; // Import the client component
import { notFound } from "next/navigation"; // Import for handling errors
import { createServerClient, type CookieOptions } from "@supabase/ssr"; // Import Supabase server client
import { cookies } from "next/headers"; // Import cookies

// Define Message type matching the client component
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

// --- Data Fetching Function (Server-Side) ---
async function getChatData(conversationId: string): Promise<{
  persona: Persona;
  initialMessages: Message[];
  error?: string;
}> {
  let initialMessages: Message[] = [];
  let fetchError: string | undefined = undefined;

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {}
        },
      },
    }
  );

  try {
    // --- Step 1: Fetch Conversation & Persona ID ---
    console.log(`SERVER_FN: Fetching conversation for ID: ${conversationId}`);
    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .select("persona_id, user_id")
      .eq("id", conversationId)
      .single();

    if (conversationError || !conversationData) {
      console.error(
        "SERVER_FN Error fetching conversation:",
        conversationError
      );
      if (conversationError?.code === "PGRST116" || !conversationData) {
        console.error(
          `Conversation with ID ${conversationId} not found or not accessible.`
        );
        notFound();
      }
      throw new Error("Failed to fetch conversation data.");
    }

    const fetchedPersonaId = conversationData.persona_id;
    console.log(
      "SERVER_FN Fetched persona_id:",
      fetchedPersonaId,
      "for user:",
      conversationData.user_id
    );

    if (!fetchedPersonaId) {
      console.error("SERVER_FN: persona_id is missing in conversation data.");
      throw new Error("Persona ID missing in conversation.");
    }

    // --- Step 2: Fetch Persona Details from DB ---
    console.log(
      `SERVER_FN: Fetching persona details for ID: ${fetchedPersonaId}`
    );
    const { data: fetchedPersona, error: personaError } = await supabase
      .from("personas")
      .select("*")
      .eq("id", fetchedPersonaId)
      .single();

    if (personaError || !fetchedPersona) {
      console.error("SERVER_FN Error fetching persona details:", personaError);
      throw new Error(
        `Persona configuration not found in database for ID: ${fetchedPersonaId}`
      );
    }

    const persona: Persona = fetchedPersona;
    console.log("SERVER_FN Found Persona from DB:", persona.name);

    // --- Step 3: Fetch Messages Directly ---
    console.log(
      `SERVER_FN: Fetching messages directly for conversation: ${conversationId}`
    );
    const { data: fetchedMessagesRaw, error: messagesError } = await supabase
      .from("messages")
      .select("id, content, role, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("SERVER_FN Error fetching messages:", messagesError);
      fetchError = "Failed to load messages.";
      initialMessages = [];
    } else {
      initialMessages = (fetchedMessagesRaw || []).map((msg) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as "user" | "assistant",
        created_at: msg.created_at,
      }));
    }
    console.log(`SERVER_FN Found ${initialMessages.length} initial messages.`);

    return { persona, initialMessages, error: fetchError };
  } catch (error) {
    console.error(
      `Critical error during getChatData for conv ${conversationId}:`,
      error
    );
    notFound();
  }
}

// Define props type for the Server Component
interface ChatPageParams {
  params: {
    conversationId: string;
  };
}

// The Server Component that fetches data and renders the client component
export default async function ChatPage({ params }: ChatPageParams) {
  const { conversationId } = params;

  const { persona, initialMessages, error } = await getChatData(conversationId);

  // Log if there was a non-critical error fetching messages
  if (error) {
    console.warn(
      `Non-critical fetch error for conversation ${conversationId}: ${error}`
    );
  }

  // Render the Client Component with fetched data
  return (
    <ChatClient
      persona={persona}
      initialMessages={initialMessages}
      conversationId={conversationId}
    />
  );
}

// Remove all client-side hooks and rendering logic previously here
