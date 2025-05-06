"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Compass, Settings, User, SendHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/sidebar";
import { Persona } from "@/lib/types"; // Assuming types are defined here

// Define type for fetched conversations
interface Conversation {
  id: string;
  created_at: string;
  // Add other fields if needed, e.g., name, persona_name
}

// Define props for the Dashboard component
interface DashboardProps {
  initialPersonas: Persona[];
  initialError: string | null; // To display fetch error from server
}

export default function Dashboard({
  initialPersonas,
  initialError,
}: DashboardProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [actualChats, setActualChats] = useState<Conversation[]>([]);
  const router = useRouter();

  // Initialize state with props
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [fetchError, setFetchError] = useState<string | null>(initialError);

  // Remove the general 'error' state if it was only for persona loading,
  // or rename/refactor if used for other errors like starting chat.
  // Let's keep the 'error' state specifically for chat start errors for now.
  const [startChatError, setStartChatError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoadingChats(true);
      setChatsError(null);
      setActualChats([]);

      try {
        console.log("DASHBOARD: Fetching previous chats...");
        const response = await fetch("/api/conversations");

        if (!response.ok) {
          if (response.status === 401) {
            console.log("DASHBOARD: User not authenticated. No chats to load.");
          } else {
            const errorData = await response.json();
            console.error(
              "DASHBOARD: API Error fetching chats:",
              response.status,
              errorData
            );
            throw new Error(
              errorData.error || `Failed to fetch chats (${response.status})`
            );
          }
        } else {
          const chats: Conversation[] = await response.json();
          console.log(`DASHBOARD: Fetched ${chats.length} chats.`);
          setActualChats(chats);
        }
      } catch (err) {
        console.error("DASHBOARD: Error fetching chats (catch block):", err);
        setChatsError(
          err instanceof Error ? err.message : "Could not load previous chats."
        );
      } finally {
        setIsLoadingChats(false);
      }
    };

    fetchChats();
  }, []);

  const handleStartChat = useCallback(async () => {
    if (!selectedPersonaId) {
      setStartChatError("Please select a persona to start chatting.");
      return;
    }

    setIsLoading(true);
    setStartChatError(null);

    try {
      console.log("Starting chat with persona ID:", selectedPersonaId);
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personaId: selectedPersonaId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Data:", errorData);
        throw new Error(errorData.error || "Failed to create conversation");
      }

      const data = await response.json();
      const { conversationId } = data;

      if (!conversationId) {
        console.error("API did not return conversationId:", data);
        throw new Error("Conversation ID not received from server.");
      }

      console.log("Received conversation ID:", conversationId);
      router.push(`/chat/${conversationId}`);
    } catch (err) {
      console.error("Error starting chat:", err);
      setStartChatError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedPersonaId, router]);

  const handlePreviousChatClick = useCallback(
    (chatId: string) => {
      console.log("Navigating to previous chat:", chatId);
      router.push(`/chat/${chatId}`);
    },
    [router]
  );

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <SidebarProvider>
        <Sidebar
          variant="sidebar"
          collapsible="icon"
          className="border-r border-border"
        >
          <SidebarHeader className="px-3 py-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  className="w-full justify-start gap-3"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  variant="outline"
                  className="w-full justify-start gap-3"
                >
                  <Compass className="h-5 w-5" />
                  <span>Explore</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <Separator className="mx-3" />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Previous Chats</SidebarGroupLabel>
              <SidebarGroupContent>
                <ScrollArea className="h-[calc(100vh-220px)]">
                  {isLoadingChats && (
                    <p className="p-2 text-sm text-muted-foreground">
                      Loading chats...
                    </p>
                  )}
                  {chatsError && (
                    <p className="p-2 text-sm text-destructive bg-destructive/10 rounded">
                      Error loading chats: {chatsError}
                    </p>
                  )}
                  {!isLoadingChats &&
                    !chatsError &&
                    actualChats.length === 0 && (
                      <p className="p-2 text-sm text-muted-foreground">
                        No previous chats found.
                      </p>
                    )}
                  {!isLoadingChats && !chatsError && actualChats.length > 0 && (
                    <SidebarMenu>
                      {actualChats.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            className="w-full justify-start"
                            onClick={() => handlePreviousChatClick(chat.id)}
                          >
                            <span className="truncate text-sm">
                              Chat from {formatTimestamp(chat.created_at)}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  )}
                </ScrollArea>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full justify-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="/placeholder.svg?height=32&width=32"
                      alt="User"
                    />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">User Profile</span>
                    <span className="text-xs text-muted-foreground">
                      Settings
                    </span>
                  </div>
                  <Settings className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Start a New Conversation
              </h1>
              <p className="text-muted-foreground">
                Select a persona to begin chatting
              </p>
            </div>

            {fetchError && (
              <div className="mb-4 rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                <p>Error loading personas: {fetchError}</p>
              </div>
            )}

            {startChatError && (
              <div className="mb-4 rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                <p>{startChatError}</p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {personas.map((persona) => (
                <Card
                  key={persona.id}
                  className={`cursor-pointer transition-shadow hover:shadow-md ${
                    selectedPersonaId === persona.id
                      ? "border-2 border-primary shadow-lg"
                      : "border"
                  }`}
                  onClick={() => {
                    setSelectedPersonaId(persona.id);
                    setStartChatError(null);
                  }}
                >
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={
                          persona.avatar_url ||
                          "/placeholder.svg?height=80&width=80"
                        }
                        alt={persona.name}
                      />
                      <AvatarFallback>
                        {persona.name?.charAt(0)?.toUpperCase() || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle>{persona.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {persona.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleStartChat}
                disabled={!selectedPersonaId || isLoading}
                size="lg"
                className="gap-2"
              >
                {isLoading ? (
                  "Starting..."
                ) : (
                  <>
                    Start Chatting <SendHorizontal className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
