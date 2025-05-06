import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/crud"; // Import admin client for inserts
import OpenAI from "openai"; // Import OpenAI
import { Persona } from "@/lib/types";

// Define the expected request body structure
interface PostRequestBody {
  conversationId: string;
  content: string;
  role: "user" | "assistant"; // Enforce role type
}

// Define the structure for the assistant message (actual DB structure)
interface AssistantMessage {
  id: string;
  content: string;
  role: "assistant";
  created_at: string;
  conversation_id: string; // Should match the input
}

// Define type for history messages used in mapping
interface HistoryMessage {
  role: string;
  content: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure OPENAI_API_KEY is in .env.local
});

export async function POST(request: Request) {
  // Remove unused simulation variables
  // let userMessageId: string | null = null;
  // let userMessageCreatedAt: string | null = null;
  let assistantMessage: AssistantMessage | null = null;

  try {
    const body: PostRequestBody = await request.json();
    const { conversationId, content: userMessageContent, role } = body;

    // Basic validation
    if (!conversationId || !userMessageContent || !role) {
      return NextResponse.json(
        { error: "Missing required fields: conversationId, content, role" },
        { status: 400 }
      );
    }
    if (role !== "user") {
      return NextResponse.json(
        { error: "Only user messages can be created via this endpoint." },
        { status: 400 }
      );
    }

    console.log(
      `API: 1. Received user message for conversation ${conversationId}:`,
      { userMessageContent, role }
    );

    // --- Step 1: Save User Message (Actual DB Insert) ---
    // REMOVE SIMULATION
    // console.warn("API SIMULATION: Assuming user message insertion successful.");
    // userMessageId = crypto.randomUUID();
    // userMessageCreatedAt = new Date().toISOString();

    const { data: savedUserMessage, error: userInsertError } =
      await supabaseAdmin
        .from("messages")
        .insert({
          conversation_id: conversationId,
          content: userMessageContent,
          role: role,
        })
        .select("id, created_at") // Select needed fields
        .single();

    if (userInsertError || !savedUserMessage) {
      console.error("API Error inserting user message:", userInsertError);
      throw new Error(
        `Failed to save user message: ${
          userInsertError?.message || "Unknown error"
        }`
      );
    }
    console.log("API: Saved user message with ID:", savedUserMessage.id);

    // --- Step 2a: Fetch Conversation History & Persona Info ---
    console.log(
      `API: 2a. Fetching history and persona info for ${conversationId}...`
    );

    // Fetch Persona ID from conversation
    const { data: convData, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("persona_id")
      .eq("id", conversationId)
      .single();

    if (convError || !convData?.persona_id) {
      throw new Error(
        `Failed to fetch persona_id for conversation ${conversationId}: ${convError?.message}`
      );
    }
    const personaId = convData.persona_id;

    // !!! 수정된 부분: DB에서 페르소나 정보 조회 !!!
    console.log(`API: Fetching persona details from DB for ID: ${personaId}`);
    const { data: fetchedPersona, error: personaFetchError } =
      await supabaseAdmin
        .from("personas") // 'personas' 테이블 조회
        .select("*") // 필요한 정보 (특히 system_prompt) 선택
        .eq("id", personaId) // 가져온 persona_id 사용
        .single(); // 해당 ID의 페르소나는 반드시 하나여야 함

    if (personaFetchError || !fetchedPersona) {
      console.error("API Error fetching persona details:", personaFetchError);
      // 여기서 오류 발생 시 사용자에게 전달될 메시지
      throw new Error(`Persona config not found for ID: ${personaId}`);
    }
    // 타입 캐스팅 또는 인터페이스 준수 확인
    const persona: Persona = fetchedPersona;
    console.log("API: Found Persona from DB:", persona.name);

    // Fetch last N messages (e.g., last 10 messages for context)
    const { data: history, error: historyError } = await supabaseAdmin
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false }) // Get recent messages first
      .limit(10); // Limit context window

    if (historyError) {
      console.error("API Error fetching history:", historyError);
      throw new Error(
        `Failed to fetch conversation history: ${historyError.message}`
      );
    }

    // Reverse history to be in chronological order for OpenAI
    const orderedHistory: HistoryMessage[] = history ? history.reverse() : [];
    console.log(`API: Fetched ${orderedHistory.length} previous messages.`);

    // --- Step 2b: Call OpenAI API ---
    console.log(
      `API: 2b. Calling OpenAI for conversation ${conversationId}...`
    );

    // Construct messages for OpenAI
    const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        // DB에서 가져온 페르소나의 시스템 프롬프트 사용
        content: persona.system_prompt || "You are a helpful assistant.",
      },
      // Map history to OpenAI format
      ...orderedHistory.map((msg: HistoryMessage) => ({
        role: msg.role as "user" | "assistant", // Type assertion
        content: msg.content,
      })),
      { role: "user", content: userMessageContent }, // Add the new user message
    ];

    let assistantResponseContent = "Sorry, I couldn't generate a response."; // Default error response
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Or use a different model like gpt-4
        messages: openAiMessages,
        temperature: 0.7, // Adjust creativity (0 to 1)
      });

      assistantResponseContent =
        completion.choices[0]?.message?.content?.trim() ||
        assistantResponseContent;
      console.log("API: OpenAI response received.");
    } catch (openaiError) {
      console.error("API Error calling OpenAI:", openaiError);
      // Keep the default error response content
      // Optionally, could throw error here if needed, but maybe better to save the error message?
    }

    // --- Step 3: Save Assistant Message (Actual DB Insert with REAL content) ---
    const { data: savedAssistantMessage, error: assistantInsertError } =
      await supabaseAdmin
        .from("messages")
        .insert({
          conversation_id: conversationId,
          content: assistantResponseContent,
          role: "assistant",
        })
        .select("id, created_at, content, role, conversation_id")
        .single();

    if (assistantInsertError || !savedAssistantMessage) {
      console.error(
        "API Error inserting assistant message:",
        assistantInsertError
      );
      throw new Error(
        `Failed to save assistant response: ${
          assistantInsertError?.message || "Unknown error"
        }`
      );
    }

    // Construct the response object from the actual saved data
    assistantMessage = savedAssistantMessage as AssistantMessage;

    console.log(
      `API: 3. Assistant response generated (OpenAI) and saved (ID: ${assistantMessage.id}).`
    );

    // Return the actual saved assistant message object
    return NextResponse.json(
      {
        message: "User message saved and assistant response generated (OpenAI)",
        assistantMessage: assistantMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error processing message:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: `Failed to process message: ${errorMessage}` },
      { status: 500 }
    );
  }
}
