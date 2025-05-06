import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { saveMessage, supabaseAdmin } from "@/lib/supabase/crud";

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt, conversationId } = await req.json();

    // Validate required fields
    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "conversationId is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 먼저 conversation_id가 실제로 존재하는지 확인 (외래 키 제약조건 위반 방지)
    const { data: conversationCheck, error: checkError } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .single();

    if (checkError || !conversationCheck) {
      console.error(
        "Invalid conversationId - not found in database:",
        conversationId
      );
      return new Response(
        JSON.stringify({
          error: "Invalid conversationId - conversation not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Verified conversation exists:", conversationId);

    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1];

    // Save the user message to the database
    try {
      if (latestUserMessage.role === "user") {
        await saveMessage(conversationId, latestUserMessage.content, "user");
        console.log("Successfully saved user message to database");
      }
    } catch (saveError) {
      // 메시지 저장이 실패해도 채팅은 계속 진행합니다 (중요 데이터가 아니므로)
      console.error("Failed to save user message:", saveError);
      // 에러를 기록하되 채팅 응답은 계속 진행합니다
    }

    // Create a streaming response
    const result = streamText({
      model: openai("gpt-4-turbo"),
      system: systemPrompt || "You are a helpful assistant.",
      messages,
      // onFinish 콜백을 사용하여 전체 응답 텍스트 캡처
      onFinish: async ({ text }) => {
        try {
          // 완료된 전체 응답 텍스트 저장
          await saveMessage(conversationId, text, "assistant");
          console.log(
            "Successfully saved complete assistant message to database"
          );
        } catch (error) {
          console.error("Error saving assistant message:", error);
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
