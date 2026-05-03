import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { format } from "date-fns";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useListOpenaiConversationMessages,
  getListOpenaiConversationMessagesQueryKey,
  getListOpenaiConversationsQueryKey,
  getListEventsQueryKey,
  getListTasksQueryKey,
  getListMealsQueryKey,
  getGetUpcomingEventsQueryKey,
  getGetPendingTasksQueryKey,
  getGetThisWeekMealsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, User, ArrowUpRight, X, Calendar, CheckSquare, Utensils, Mic, MicOff } from "lucide-react";
import { Link } from "wouter";

type PendingAction = { action: string; label: string; icon: string };

function ActionCard({ action }: { action: PendingAction }) {
  const iconMap: Record<string, React.ReactNode> = {
    calendar: <Calendar className="h-3 w-3" />,
    "check-square": <CheckSquare className="h-3 w-3" />,
    utensils: <Utensils className="h-3 w-3" />,
  };
  const labelMap: Record<string, string> = {
    create_event: "Event added",
    create_task: "Task added",
    create_meal: "Meal planned",
  };
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-medium w-fit">
      {iconMap[action.icon] ?? <Sparkles className="h-3 w-3" />}
      <span>{labelMap[action.action] ?? "Done"}: {action.label}</span>
    </div>
  );
}

export function AIChatBubble() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations } = useListOpenaiConversations();
  const { data: messages } = useListOpenaiConversationMessages(
    activeConversationId as number,
    { query: { enabled: !!activeConversationId } } as any
  );

  const createConversationMutation = useCreateOpenaiConversation({
    mutation: {
      onSuccess: (newConv) => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        setActiveConversationId(newConv.id);
      },
    },
  });

  useEffect(() => {
    if (open && conversations && conversations.length > 0 && !activeConversationId) {
      const sorted = [...conversations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setActiveConversationId(sorted[0].id);
    }
  }, [open, conversations, activeConversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isStreaming, pendingActions]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;
    const content = inputMessage.trim();
    setInputMessage("");
    setPendingActions([]);

    let convId = activeConversationId;
    if (!convId) {
      const newConv = await createConversationMutation.mutateAsync({
        data: { title: content.substring(0, 40) },
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
                  queryKey: getListOpenaiConversationMessagesQueryKey(convId as number),
                });
                queryClient.invalidateQueries({
                  queryKey: getListOpenaiConversationsQueryKey(),
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

  const baseInputRef = useRef("");
  const { isListening, isSupported: voiceSupported, toggle: toggleVoice } = useVoiceInput({
    onStart: () => { baseInputRef.current = inputMessage; },
    onUpdate: (liveText) => setInputMessage(
      baseInputRef.current + (baseInputRef.current && liveText ? " " : "") + liveText
    ),
  });

  const activeConversation = conversations?.find((c) => c.id === activeConversationId);
  const allMessages = messages ?? [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg px-4 h-12 font-medium text-sm transition-all hover:shadow-xl hover:scale-105 active:scale-95",
          isMobile ? "bottom-20 right-4" : "bottom-6 right-6"
        )}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>Ask AI</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            "rounded-t-2xl p-0 flex flex-col gap-0",
            isMobile ? "h-[85vh]" : "h-[520px] max-w-lg ml-auto mr-6 mb-6 rounded-2xl"
          )}
        >
          <SheetHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-sm font-semibold leading-tight">
                  {activeConversation?.title ?? "NaturHome AI"}
                </SheetTitle>
                {activeConversation && (
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(activeConversation.updatedAt), "MMM d, h:mm a")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/ai" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Open full chat">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as any}>
            {allMessages.length === 0 && !isStreaming ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">How can I help you today?</p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  {["Plan this week's meals", "Add a family event", "Create a task for me"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInputMessage(s)}
                      className="text-xs px-3 py-2 border rounded-lg hover:bg-muted text-left transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                {allMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "user" ? (
                      /* User bubble — stays narrow */
                      <>
                        <div className="max-w-[80%] rounded-2xl rounded-tr-none px-3 py-2 text-sm bg-primary text-primary-foreground">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </>
                    ) : (
                      /* Assistant bubble — full width for recipes, lists, etc. */
                      <>
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 rounded-2xl rounded-tl-none px-3 py-2.5 text-sm bg-muted">
                          <div className="prose prose-sm dark:prose-invert max-w-none
                            prose-headings:font-semibold prose-headings:text-foreground
                            prose-h1:text-sm prose-h2:text-sm prose-h3:text-xs
                            prose-p:leading-relaxed prose-p:my-1
                            prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5
                            prose-strong:text-foreground
                            prose-code:bg-background prose-code:px-1 prose-code:rounded prose-code:text-xs
                            prose-hr:my-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex flex-col items-start gap-2">
                    {pendingActions.length > 0 && (
                      <div className="flex flex-col gap-1 pl-8">
                        {pendingActions.map((a, i) => (
                          <ActionCard key={i} action={a} />
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 w-full">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 rounded-2xl rounded-tl-none px-3 py-2.5 text-sm bg-muted">
                        {streamingContent ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none
                            prose-headings:font-semibold prose-headings:text-foreground
                            prose-h1:text-sm prose-h2:text-sm prose-h3:text-xs
                            prose-p:leading-relaxed prose-p:my-1
                            prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5
                            prose-strong:text-foreground
                            prose-code:bg-background prose-code:px-1 prose-code:rounded prose-code:text-xs">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex gap-1 items-center py-0.5">
                            <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce" />
                            <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {conversations && conversations.length > 1 && (
            <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-[10px] text-muted-foreground shrink-0">Chats:</span>
              {[...conversations]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 5)
                .map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-full border shrink-0 transition-colors",
                      conv.id === activeConversationId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    {conv.title.length > 20 ? conv.title.substring(0, 20) + "…" : conv.title}
                  </button>
                ))}
              <button
                onClick={async () => {
                  const newConv = await createConversationMutation.mutateAsync({
                    data: { title: "New Conversation" },
                  });
                  setActiveConversationId(newConv.id);
                }}
                className="text-[10px] px-2 py-1 rounded-full border shrink-0 bg-background hover:bg-muted"
              >
                + New
              </button>
            </div>
          )}

          <div className="px-4 py-3 border-t bg-background shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Ask anything..."}
                disabled={isStreaming}
                className={cn(
                  "flex-1 min-h-[40px] max-h-[120px] rounded-xl border bg-muted/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none overflow-hidden disabled:opacity-50",
                  isListening && "border-primary/50 ring-2 ring-primary/20"
                )}
              />
              {voiceSupported && (
                <Button
                  type="button"
                  onClick={toggleVoice}
                  size="icon"
                  variant={isListening ? "secondary" : "outline"}
                  className={cn(
                    "h-10 w-10 rounded-xl shrink-0",
                    isListening && "animate-pulse bg-primary/15 border-primary/30 text-primary"
                  )}
                  disabled={isStreaming}
                  title={isListening ? "Stop listening" : "Speak your message"}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="h-10 w-10 rounded-xl shrink-0"
                disabled={!inputMessage.trim() || isStreaming}
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isListening && (
              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Listening — words will appear as you speak
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
