/**
 * 채팅 API 요청 인터페이스
 */
export interface ChatRequest {
  /** 페르소나 ID */
  personaId: string;
  /** 사용자 메시지 */
  message: string;
  /** 선택적 대화 기록 */
  history?: {
    /** 메시지 역할 (사용자 또는 어시스턴트) */
    role: "user" | "assistant";
    /** 메시지 내용 */
    content: string;
  }[];
}

/**
 * 채팅 API 응답 인터페이스
 */
export interface ChatResponse {
  /** 응답 메시지 */
  response: string;
}

/**
 * 에러 응답 인터페이스
 */
export interface ErrorResponse {
  /** 에러 메시지 */
  error: string;
}
