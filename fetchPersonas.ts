import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Persona 인터페이스 - v3_pgvector_integrated.personas 테이블의 구조를 정의합니다.
 */
export interface Persona {
  persona_id: string;
  name: string;
  description: string;
  created_at: string;
  // 필요한 경우 추가 필드를 여기에 정의할 수 있습니다.
}

/**
 * v3_pgvector_integrated 스키마의 personas 테이블에서 모든 레코드를 가져옵니다.
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @returns Promise<Persona[]> - Persona 객체 배열 반환
 * @throws Error - 데이터 가져오기에 실패한 경우 에러 발생
 */
export async function fetchPersonas(
  supabase: SupabaseClient
): Promise<Persona[]> {
  try {
    const { data, error } = await supabase
      .from("v3_pgvector_integrated.personas")
      .select("*");

    if (error) {
      throw new Error(`페르소나 데이터 가져오기 실패: ${error.message}`);
    }

    return data as Persona[];
  } catch (error) {
    throw new Error(
      `페르소나 데이터 가져오기 오류: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}
