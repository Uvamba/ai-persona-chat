"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChatInterfaceProps } from "@/lib/types";
import ChatMessage from "@/components/chat-message";
import PersonaSelector from "@/components/persona-selector";

export default function ChatInterface({
  personas,
  selectedPersona,
  setSelectedPersona,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-80 border-r flex-col">
        <div className="p-4 font-semibold text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span>Persona Chat</span>
        </div>
        <Separator />
        <PersonaSelector
          personas={personas}
          selectedPersona={selectedPersona}
          setSelectedPersona={setSelectedPersona}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[80%] max-w-[300px]">
          <div className="p-4 font-semibold text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span>Persona Chat</span>
          </div>
          <Separator />
          <PersonaSelector
            personas={personas}
            selectedPersona={selectedPersona}
            setSelectedPersona={(persona) => {
              setSelectedPersona(persona);
              setSidebarOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full">
        {/* Chat Header */}
        <header className="h-14 border-b flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <div className="flex items-center gap-2">
              <img
                src={selectedPersona.avatar_url || "/placeholder.svg"}
                alt={selectedPersona.name}
                className="h-6 w-6 rounded-full"
              />
              <span className="font-medium">{selectedPersona.name}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            New Chat
          </Button>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <h3 className="text-lg font-medium mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm">
                  Send a message to begin chatting with {selectedPersona.name}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  persona={selectedPersona}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <footer className="border-t p-4">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </footer>
      </main>
    </div>
  );
}
