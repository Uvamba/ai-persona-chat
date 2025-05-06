import { SupabaseClient } from "@supabase/supabase-js";

export interface Persona {
  persona_id: string;
  name: string;
  description: string;
  created_at: string;
}

export async function fetchAllPersonas(
  supabase: SupabaseClient
): Promise<Persona[]> {
  try {
    const { data, error } = await supabase
      .from("v3_pgvector_integrated.personas")
      .select("*");

    if (error) {
      throw error;
    }

    return data as Persona[];
  } catch (error) {
    let errorMessage = "알 수 없는 오류가 발생했습니다.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(
      `페르소나 데이터를 가져오는데 실패했습니다: ${errorMessage}`
    );
  }
}
