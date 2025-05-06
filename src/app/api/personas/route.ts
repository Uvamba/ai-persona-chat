import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server"; // Use the server client helper

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("API Auth Error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("API Body Parse Error:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { name, description, system_prompt, avatar_url } = body;

    // 3. Basic validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Persona name is required" },
        { status: 400 }
      );
    }
    if (
      !system_prompt ||
      typeof system_prompt !== "string" ||
      system_prompt.trim() === ""
    ) {
      return NextResponse.json(
        { error: "System prompt is required" },
        { status: 400 }
      );
    }

    // 4. Insert into Supabase
    const { data: newPersona, error: insertError } = await supabase
      .from("personas")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null, // Handle optional description
        system_prompt: system_prompt.trim(),
        avatar_url: avatar_url?.trim() || null, // Handle optional avatar_url
        is_predefined: false, // Explicitly set to false for user-created personas
      })
      .select() // Select the newly inserted row
      .single(); // Expecting a single row back

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      // Check for unique constraint violation (user_id, name)
      if (insertError.code === "23505") {
        // Postgres unique violation code
        return NextResponse.json(
          {
            error: "A persona with this name already exists for your account.",
          },
          { status: 409 }
        ); // 409 Conflict
      }
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    // 5. Return success response
    return NextResponse.json(newPersona, { status: 201 }); // 201 Created
  } catch (error: any) {
    console.error("API Route Generic Error:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

// Optional: Add a basic GET handler if needed later, or handle OPTIONS for CORS if required.
// export async function GET(request: Request) { ... }
