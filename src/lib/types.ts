import { Message } from "ai";

export interface Persona {
  id: string;
  created_at: string;
  user_id: string | null;
  name: string;
  description: string | null;
  avatar_url: string | null;
  system_prompt: string;
  is_predefined: boolean;
}

export interface ChatInterfaceProps {
  personas: Persona[];
  selectedPersona: Persona;
  setSelectedPersona: (persona: Persona) => void;
  messages: Message[];
  input: string;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}
