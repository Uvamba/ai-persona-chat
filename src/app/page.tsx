import Dashboard from "@/components/dashboard"; // Import the Dashboard component
import { createClient } from "@/lib/supabase/server"; // Helper to create server client
import { cookies } from "next/headers";
import { Persona } from "@/lib/types"; // Ensure Persona type is imported

// Remove old imports like useState, useCallback, useEffect, useRouter, Button, Persona, createClient
// Remove sample personas data
// Remove log information

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore); // Create server client

  let personas: Persona[] = [];
  let fetchError: string | null = null;

  try {
    // RLS policies automatically filter personas for the logged-in user
    // (own personas + predefined) or only predefined for logged-out users.
    const { data, error } = await supabase
      .from("personas")
      .select("*")
      .order("created_at", { ascending: true }); // Optional: Order them

    if (error) {
      throw error;
    }
    personas = data || [];
  } catch (error: any) {
    console.error("Error fetching personas:", error);
    fetchError = "Failed to load personas. Please try again later.";
    // Assign an empty array in case of error to avoid crashing the dashboard
    personas = [];
  }

  return (
    <main className="flex h-screen w-full overflow-hidden">
      {" "}
      {/* Ensure full screen layout */}
      <Dashboard initialPersonas={personas} initialError={fetchError} />{" "}
      {/* Render the Dashboard component */}
    </main>
  );
}
