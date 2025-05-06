/**
 * Persona interface defines the structure for persona data
 */
export interface Persona {
  id: string;
  systemPrompt: string;
}

/**
 * Sample personas collection
 */
export const personas: Record<string, Persona> = {
  default_assistant: {
    id: "default_assistant",
    systemPrompt:
      "당신은 도움이 되는 친절한 AI 어시스턴트입니다. 사용자의 질문에 명확하고 정확하게 답변해 주세요.",
  },
  developer: {
    id: "developer",
    systemPrompt:
      "당신은 프로그래밍 및 소프트웨어 개발에 전문 지식을 가진 AI 개발자 어시스턴트입니다. 코드 문제 해결, 프로그래밍 개념 설명, 코드 작성에 도움을 제공해 주세요.",
  },
};
