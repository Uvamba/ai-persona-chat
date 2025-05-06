import { SupabaseClient } from "@supabase/supabase-js";
import { Persona } from "./fetchPersonas";

/**
 * 새로운 Persona 레코드 생성 함수
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @param persona - 생성할 Persona 데이터 (persona_id와 created_at은 자동 생성됨)
 * @returns 생성된 Persona 객체
 * @throws Error - 데이터 생성 실패 시 에러 발생
 */
export async function createPersona(
  supabase: SupabaseClient,
  persona: Omit<Persona, "persona_id" | "created_at">
): Promise<Persona> {
  try {
    const { data, error } = await supabase
      .from("v3_pgvector_integrated.personas")
      .insert([persona])
      .select()
      .single();

    if (error) {
      throw new Error(`페르소나 생성 실패: ${error.message}`);
    }

    return data as Persona;
  } catch (error) {
    throw new Error(
      `페르소나 생성 오류: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}

/**
 * 기존 Persona 레코드 업데이트 함수
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @param persona_id - 업데이트할 Persona의 ID
 * @param updates - 업데이트할 필드와 값
 * @returns 업데이트된 Persona 객체
 * @throws Error - 데이터 업데이트 실패 시 에러 발생
 */
export async function updatePersona(
  supabase: SupabaseClient,
  persona_id: string,
  updates: Partial<Omit<Persona, "persona_id" | "created_at">>
): Promise<Persona> {
  try {
    const { data, error } = await supabase
      .from("v3_pgvector_integrated.personas")
      .update(updates)
      .eq("persona_id", persona_id)
      .select()
      .single();

    if (error) {
      throw new Error(`페르소나 업데이트 실패: ${error.message}`);
    }

    return data as Persona;
  } catch (error) {
    throw new Error(
      `페르소나 업데이트 오류: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}

/**
 * Persona 레코드 삭제 함수
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @param persona_id - 삭제할 Persona의 ID
 * @returns 성공 시 true
 * @throws Error - 데이터 삭제 실패 시 에러 발생
 */
export async function deletePersona(
  supabase: SupabaseClient,
  persona_id: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("v3_pgvector_integrated.personas")
      .delete()
      .eq("persona_id", persona_id);

    if (error) {
      throw new Error(`페르소나 삭제 실패: ${error.message}`);
    }

    return true;
  } catch (error) {
    throw new Error(
      `페르소나 삭제 오류: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}

/**
 * 특정 Persona 레코드 조회 함수
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @param persona_id - 조회할 Persona의 ID
 * @returns Persona 객체 또는 null(존재하지 않는 경우)
 * @throws Error - 데이터 조회 실패 시 에러 발생
 */
export async function getPersonaById(
  supabase: SupabaseClient,
  persona_id: string
): Promise<Persona | null> {
  try {
    const { data, error } = await supabase
      .from("v3_pgvector_integrated.personas")
      .select("*")
      .eq("persona_id", persona_id)
      .single();

    if (error) {
      // 404 에러인 경우 null 반환
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`페르소나 조회 실패: ${error.message}`);
    }

    return data as Persona;
  } catch (error) {
    throw new Error(
      `페르소나 조회 오류: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}
