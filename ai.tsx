import { useState, useRef, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useListOpenaiConversationMessages,
  getListOpenaiConversationsQueryKey,
  getListOpenaiConversationMessagesQueryKey,
  getListEventsQueryKey,
  getListTasksQueryKey,
  getListMealsQueryKey,
  getGetUpcomingEventsQueryKey,
  getGetPendingTasksQueryKey,
  getGetThisWeekMealsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, Loader2, User, Search, ArrowLeft, Sparkles, Calendar, CheckSquare, Utensils } from "lucide-react";

type PendingAction = { action: string; label: string; icon: string };

function ActionCard({ action }: { action: PendingAction }) {
  const iconMap: Record<string, React.ReactNode> = {
    calendar: <Calendar className="h-3.5 w-3.5" />,
    "check-square": <CheckSquare className="h-3.5 w-3.5" />,
    utensils: <Utensils className="h-3.5 w-3.5" />,
  };
  const labelMap: Record<string, string> = {
    create_event: "Event added",
    create_task: "Task added",
    create_meal: "Meal planned",
  };
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium w-fit">
      {iconMap[action.icon] ?? <Sparkles className="h-3.5 w-3.5" />}
      <span>{labelMap[action.action] ?? "Done"}: {action.label}</span>
    </div>
  );
}

export default function AIAssistant() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations, isLoading: isLoadingConversations } = useListOpenaiConversations();
  const { data: messages, isLoading: isLoadingMessages } = useListOpenaiConversationMessages(
    selectedConversationId as number,
    { query: { enabled: !!selectedConversationId } } as any
  );

  const createConversationMutation = useCreateOpenaiConversation({
    mutation: {
      onSuccess: (newConv) => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        setSelectedConversationId(newConv.id);
        if (isMobile) setShowMobileChat(true);
      },
    },
  });

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    const filtered = conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return [...filtered].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [conversations, searchQuery]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isStreaming, pendingActions]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputMessage]);

  const handleCreateConversation = (initialMessage?: string) => {
    const title = initialMessage ? initialMessage.substring(0, 40) : "New Conversation";
    createConversationMutation.mutate({ data: { title } });
    if (initialMessage) setInputMessage(initialMessage);
  };

  const invalidateDataCaches = (actions: PendingAction[]) => {
    const hasEvent = actions.some(a => a.action === "create_event");
    const hasTask = actions.some(a => a.action === "create_task");
    const hasMeal = actions.some(a => a.action === "create_meal");
    if (hasEvent) {
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
    }
    if (hasTask) {
      queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPendingTasksQueryKey() });
    }
    if (hasMeal) {
      queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetThisWeekMealsQueryKey() });
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    let convId = selectedConversationId;
    const content = inputMessage.trim();
    setInputMessage("");
    setPendingActions([]);

    if (!convId) {
      const newConv = await createConversationMutation.mutateAsync({
        data: { title: content.substring(0, 40) }
      });
      convId = newConv.id;
    }

    setIsStreaming(true);
    setStreamingContent("");

    const collectedActions: PendingAction[] = [];

    try {
      const response = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              if (data.action) {
                const newAction = { action: data.action, label: data.label, icon: data.icon };
                collectedActions.push(newAction);
                setPendingActions([...collectedActions]);
              }
              if (data.done) {
                setIsStreaming(false);
                setStreamingContent("");
                setPendingActions([]);
                invalidateDataCaches(collectedActions);
                queryClient.invalidateQueries({
                  queryKey: getListOpenaiConversationMessagesQueryKey(convId as number)
                });
                queryClient.invalidateQueries({
                  queryKey: getListOpenaiConversationsQueryKey()
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestions = [
    "Plan this week's meals",
    "Add a family event for this weekend",
    "Create a shopping list task"
  ];

  const renderConversationList = () => (
    <div className="flex flex-col h-full bg-muted/30">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Conversations</h1>
          <Button size="icon" onClick={() => handleCreateConversation()} variant="ghost">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {isLoadingConversations ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-8">
              {searchQuery ? "No matching conversations" : "No conversations yet"}
            </p>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setSelectedConversationId(conv.id);
                  if (isMobile) setShowMobileChat(true);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors flex flex-col gap-1",
                  selectedConversationId === conv.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted bg-background border"
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold truncate text-sm">{conv.title}</span>
                  <span className={cn(
                    "text-[10px] whitespace-nowrap",
                    selectedConversationId === conv.id ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {format(new Date(conv.updatedAt), "MMM d, h:mm a")}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderChatArea = () => {
    const activeConversation = conversations?.find(c => c.id === selectedConversationId);

    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center gap-3 p-4 border-b">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setShowMobileChat(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">
              {activeConversation?.title || "New Chat"}
            </h2>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {isLoadingMessages ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-1",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {msg.role === "user" ? (
                      /* User bubble — stays narrow */
                      <div className="flex gap-3 max-w-[85%] flex-row-reverse">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 border bg-primary text-primary-foreground border-primary">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="rounded-2xl rounded-tr-none px-4 py-2.5 text-sm shadow-sm bg-primary text-primary-foreground">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div className="text-[10px] mt-1.5 text-primary-foreground/70 text-right">
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Assistant bubble — full width so recipes/lists render without wrapping */
                      <div className="flex gap-3 w-full">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 border bg-background text-foreground mt-0.5">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm bg-white border text-foreground">
                          <div className="prose prose-sm dark:prose-invert max-w-none
                            prose-headings:font-semibold prose-headings:text-foreground
                            prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                            prose-p:leading-relaxed prose-p:my-1.5
                            prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2
                            prose-strong:text-foreground
                            prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs
                            prose-hr:my-3">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                          <div className="text-[10px] mt-2 text-muted-foreground">
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex flex-col items-start gap-2">
                    {pendingActions.length > 0 && (
                      <div className="flex flex-col gap-1.5 pl-11">
                        {pendingActions.map((a, i) => (
                          <ActionCard key={i} action={a} />
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 w-full">
                      <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 rounded-2xl rounded-tl-none px-4 py-3 text-sm bg-white border shadow-sm">
                        {streamingContent ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none
                            prose-headings:font-semibold prose-headings:text-foreground
                            prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                            prose-p:leading-relaxed prose-p:my-1.5
                            prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2
                            prose-strong:text-foreground
                            prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex gap-1 items-center py-1">
                            <span className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce" />
                            <span className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message NaturHome AI..."
                className="flex-1 min-h-[44px] max-h-[200px] w-full rounded-xl border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden"
                disabled={isStreaming}
              />
              <Button
                onClick={() => handleSendMessage()}
                size="icon"
                className="h-[44px] w-[44px] rounded-xl shrink-0"
                disabled={!inputMessage.trim() || isStreaming}
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to NaturHome AI</h1>
        <p className="text-lg text-muted-foreground">
          Ask me to plan meals, add events to the calendar, create tasks, or anything else to help organize your home.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleCreateConversation(suggestion)}
            className="p-4 text-sm font-medium border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col justify-between h-32 group"
          >
            <span>{suggestion}</span>
            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              Try this <Plus className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 top-[var(--header-height,0px)] bottom-[var(--bottom-nav-height,0px)] md:relative md:top-0 md:bottom-0 md:h-[calc(100vh-8rem)] flex overflow-hidden">
      <div className={cn(
        "border-r transition-all duration-300",
        isMobile ? (showMobileChat ? "hidden" : "w-full") : "w-80"
      )}>
        {renderConversationList()}
      </div>
      <div className={cn(
        "flex-1 relative transition-all duration-300",
        isMobile ? (showMobileChat ? "block w-full" : "hidden") : "block"
      )}>
        {!selectedConversationId ? renderEmptyState() : renderChatArea()}
      </div>
    </div>
  );
}
