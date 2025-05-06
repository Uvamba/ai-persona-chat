import { Message } from "ai";
import { Persona } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
  persona: Persona;
}

export default function ChatMessage({ message, persona }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
        {isUser ? (
          <div className="bg-primary h-full w-full flex items-center justify-center text-primary-foreground">
            U
          </div>
        ) : (
          <img
            src={persona.avatar_url || "/placeholder.svg"}
            alt={persona.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%]",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
