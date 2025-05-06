import { NextResponse } from "next/server";
// supabaseAdmin 임포트는 필요 없으므로 제거하거나 주석 처리합니다. (다른 곳에서 사용하지 않는다면)
// import { getOrCreateConversation, supabaseAdmin } from "@/lib/supabase/crud";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = cookies();
  // 서버 클라이언트 생성 (GET 핸들러와 유사하게)
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
          } catch (error) {
            /* 서버 컴포넌트 호출 무시 */
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            /* 서버 컴포넌트 호출 무시 */
          }
        },
      },
    }
  );

  try {
    console.log("API: /api/conversations POST called");

    // 1. 인증된 사용자 가져오기
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth Error:", authError);
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    console.log("Authenticated user ID:", user.id);

    // 2. 요청 본문에서 personaId 가져오기
    const { personaId } = await req.json();
    console.log("Received personaId:", personaId);

    // 3. personaId 유효성 검사
    if (!personaId) {
      console.error("Missing personaId in request");
      return NextResponse.json({ error: "Missing personaId" }, { status: 400 });
    }

    // 4. 대화 생성 (로그인한 사용자의 ID 사용)
    // supabaseAdmin 대신 RLS가 적용된 supabase 클라이언트 사용
    const { data: newConversation, error: insertError } = await supabase
      .from("conversations")
      .insert([
        {
          user_id: user.id, // <-- 로그인한 사용자의 ID 사용
          persona_id: personaId,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating conversation:", insertError);
      // Unique constraint violation 같은 특정 오류 처리 추가 가능
      return NextResponse.json(
        { error: "Failed to create conversation: " + insertError.message },
        { status: 500 }
      );
    }

    if (!newConversation) {
      console.error("No conversation created (insert returned null)");
      return NextResponse.json(
        { error: "Failed to create conversation - no data returned" },
        { status: 500 }
      );
    }

    const conversationId = newConversation.id;
    console.log(
      "Successfully created conversation for user:",
      user.id,
      " -> ",
      conversationId
    );

    // (선택 사항) 생성된 대화 검증 로직은 supabaseAdmin 대신 supabase 사용 가능
    // const { data: conversationCheck, error: checkError } = await supabase
    //   .from("conversations")
    //   .select("id")
    //   .eq("id", conversationId)
    //   .maybeSingle(); // single() 대신 maybeSingle()이 더 안전할 수 있음
    //
    // if (checkError || !conversationCheck) {
    //   console.error(
    //     "Verification failed - conversation does not exist after insert:",
    //     checkError || "No data returned"
    //   );
    //   return NextResponse.json(
    //     { error: "Failed to verify conversation creation" },
    //     { status: 500 }
    //   );
    // }
    // console.log("Verified conversation exists in database:", conversationId);

    // 5. 생성된 conversationId 반환
    return NextResponse.json({ conversationId });
  } catch (error) {
    console.error(
      "Error processing request in POST /api/conversations:",
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: `Failed to process request: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const cookieStore = cookies();

  // Use createServerClient from @supabase/ssr
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // We are only reading data, so set/remove might not be strictly necessary
        // but including them is safer if auth state could somehow change.
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  try {
    console.log("API: /api/conversations GET called");

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth Error:", authError);
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log("Fetching conversations for user:", user.id);

    // Fetch conversations for the authenticated user, ordered by creation date
    const { data: conversations, error: fetchError } = await supabase
      .from("conversations")
      .select("id, created_at") // Select only needed fields
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }); // Newest first

    if (fetchError) {
      console.error("Error fetching conversations:", fetchError);
      return NextResponse.json(
        {
          error: "Failed to fetch conversations",
          details: fetchError?.message,
        },
        { status: 500 }
      );
    }

    console.log(
      "Successfully fetched conversations count:",
      conversations?.length ?? 0
    );

    return NextResponse.json(conversations || [], { status: 200 });
  } catch (error) {
    console.error("API Error in /api/conversations GET:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: `Failed to process request: ${errorMessage}` },
      { status: 500 }
    );
  }
}
