"use client"; // This component handles client-side interactions

import React, { useState, useEffect, useRef, useCallback } from "react";
// Import necessary UI components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizontal } from "lucide-react";
import { Persona } from "@/lib/types";

// Define Message type locally or import if shared
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string; // Keep for potential display or sorting
}

interface ChatClientProps {
  persona: Persona;
  initialMessages: Message[];
  conversationId: string; // Pass conversationId for sending messages
}

export default function ChatClient({
  persona,
  initialMessages,
  conversationId,
}: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Use state for loading
  const [error, setError] = useState<string | null>(null); // Use state for error

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // --- Scroll to bottom effect ---
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Find the viewport element within the ScrollArea
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement | null;
      if (viewport) {
        // Use setTimeout to ensure scrolling happens after rendering updates
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
          console.log("Scrolled to bottom");
        }, 0);
      } else {
        console.warn("ScrollArea viewport not found");
      }
    }
  }, [messages]); // Trigger scroll when messages change

  // --- Handle Send Message ---
  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!newMessage.trim() || !conversationId || isLoading) return;

      const userMessageContent = newMessage.trim();
      const tempUserMessageId = `temp-user-${Date.now()}`;
      const userMessage: Message = {
        id: tempUserMessageId,
        content: userMessageContent,
        role: "user",
        created_at: new Date().toISOString(),
      };

      setNewMessage("");
      setMessages((prev) => [...prev, userMessage]);
      setError(null);
      setIsLoading(true);

      console.log(
        `CLIENT: Sending message "${userMessageContent}" to conversation: ${conversationId}`
      );

      try {
        // Call the backend API to save user message and get assistant response
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationId,
            content: userMessageContent,
            role: "user", // Role is always user when sending from client
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("API Error response:", result);
          throw new Error(
            result.error || "Failed to send message and get response"
          );
        }

        console.log("CLIENT: API call successful:", result.message);

        // --- Assistant Response Handling ---
        if (result.assistantMessage) {
          console.log(
            "CLIENT: Received assistant message:",
            result.assistantMessage
          );
          // Add the assistant message received from the API to the state
          setMessages((prev) => [
            // Optionally replace optimistic user message with final data if needed
            ...prev.map((msg) =>
              msg.id === tempUserMessageId
                ? {
                    ...userMessage /* optionally use data from API if available */,
                  }
                : msg
            ),
            result.assistantMessage as Message, // Add assistant message from API
          ]);
        } else {
          console.warn("CLIENT: Assistant message not found in API response.");
          // If needed, update the user message ID/timestamp from API even if no assistant message
        }
      } catch (err) {
        console.error("CLIENT: Error during message send/receive:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to process message. Please try again."
        );
        // Revert optimistic update for the user message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessageId));
      } finally {
        setIsLoading(false);
      }
    },
    [newMessage, conversationId, isLoading] // Keep dependencies minimal
  );

  // --- Render Logic --- (Moved from page.tsx)
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-2 border-b bg-card px-4">
        <Avatar className="h-8 w-8 border">
          <AvatarImage
            src={persona.avatar_url || "/placeholder.svg"}
            alt={persona.name}
          />
          <AvatarFallback>{persona.name?.charAt(0) || "P"}</AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-semibold">{persona.name}</h1>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-1.5 text-sm"
          onClick={() => (window.location.href = "/")}
        >
          Back to Dashboard
        </Button>
      </header>

      {/* Message List */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4 pr-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-10">
              Start a conversation <br /> Send a message to begin chatting with{" "}
              {persona.name}.
            </div>
          )}
          {error && (
            <p className="p-2 text-sm text-destructive bg-destructive/10 rounded">
              Error: {error}
            </p>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${
                message.role === "user" ? "justify-end" : ""
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={persona.avatar_url || "/placeholder.svg"}
                    alt={persona.name}
                  />
                  <AvatarFallback>
                    {persona.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[75%] rounded-lg p-3 text-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.content}
              </div>
              {message.role === "user" && (
                <Avatar className="h-6 w-6">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center items-center p-4">
              <p className="text-sm text-muted-foreground">Sending...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <footer className="sticky bottom-0 border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="relative flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            disabled={isLoading} // Disable input while sending
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isLoading}
          >
            <SendHorizontal className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
