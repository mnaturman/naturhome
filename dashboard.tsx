import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useUser } from "@clerk/react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import {
  useGetUpcomingEvents,
  useGetPendingTasks,
  useGetThisWeekMeals,
  useListFamilyMembers,
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  getListOpenaiConversationsQueryKey,
  getListOpenaiConversationMessagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CalendarPlus,
  ListPlus,
  Utensils,
  ArrowRight,
  Loader2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Users,
  Send,
  Mic,
  MicOff,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: events = [] } = useGetUpcomingEvents();
  const { data: tasks = [] } = useGetPendingTasks();
  const { data: meals = [] } = useGetThisWeekMeals();
  const { data: familyMembers = [] } = useListFamilyMembers();
  const { data: conversations } = useListOpenaiConversations();

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);

  const baseInputRef = useRef("");
  const { isListening, isSupported: voiceSupported, toggle: toggleVoice } = useVoiceInput({
    onStart: () => { baseInputRef.current = input; },
    onUpdate: (liveText) => setInput(
      baseInputRef.current + (baseInputRef.current && liveText ? " " : "") + liveText
    ),
  });

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const createConversationMutation = useCreateOpenaiConversation({
    mutation: {
      onSuccess: (newConv) => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        setActiveConvId(newConv.id);
      },
    },
  });

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayEvents = events.filter(e => isToday(parseISO(e.startTime)));
  const tomorrowEvents = events.filter(e => isTomorrow(parseISO(e.startTime)));
  const highPriorityTasks = tasks.filter(t => t.priority === "high");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayMeals = meals.filter(m => m.date.slice(0, 10) === todayStr);

  // Smart contextual suggestions based on real data
  const suggestions = useMemo(() => {
    const list: { text: string; icon: string; quick?: boolean }[] = [];
    if (todayMeals.length === 0) {
      list.push({ text: "What should we have for dinner tonight?", icon: "utensils", quick: true });
    }
    if (highPriorityTasks.length > 0) {
      list.push({ text: `Help me prioritize my ${highPriorityTasks.length} high-priority tasks`, icon: "alert" });
    }
    if (todayEvents.length > 0) {
      list.push({ text: `Summarize today's ${todayEvents.length} event${todayEvents.length > 1 ? "s" : ""} for me`, icon: "calendar" });
    }
    if (tomorrowEvents.length > 0) {
      list.push({ text: "What's on the schedule tomorrow?", icon: "calendar" });
    }
    if (list.length < 2) {
      list.push({ text: "Plan this week's meals for the family", icon: "utensils" });
      list.push({ text: "What tasks need attention this week?", icon: "check" });
    }
    return list.slice(0, 3);
  }, [todayMeals, highPriorityTasks, todayEvents, tomorrowEvents]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    setInput("");

    let convId = activeConvId;
    if (!convId) {
      const newConv = await createConversationMutation.mutateAsync({
        data: { title: content.trim().substring(0, 40) }
      });
      convId = newConv.id;
    }

    setIsStreaming(true);
    try {
      const response = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error();
      const reader = response.body?.getReader();
      if (!reader) throw new Error();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: getListOpenaiConversationMessagesQueryKey(convId as number) });
                queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
                setLocation("/ai");
              }
            } catch {}
          }
        }
      }
    } catch {}
    finally { setIsStreaming(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const iconFor = (icon: string) => {
    if (icon === "utensils") return <Utensils className="h-4 w-4 text-primary shrink-0" />;
    if (icon === "calendar") return <Calendar className="h-4 w-4 text-primary shrink-0" />;
    if (icon === "alert") return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    return <Sparkles className="h-4 w-4 text-primary shrink-0" />;
  };

  return (
    <div className="space-y-5 pb-2">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-violet-700 p-5 text-white shadow-lg">
        <div className="mb-4">
          <p className="text-sm font-medium text-white/75">{getGreeting()}</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {user?.firstName || user?.fullName || "Welcome"}
          </h1>
          <p className="text-xs text-white/60 mt-0.5">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>

        {/* AI input bar */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask me anything..."}
            disabled={isStreaming}
            className={cn(
              "w-full rounded-xl bg-white/15 border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm",
              voiceSupported ? "pr-24" : "pr-12",
              isListening && "border-white/40 placeholder:text-white/70"
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={isStreaming}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                  isListening
                    ? "bg-white/30 text-white animate-pulse"
                    : "bg-white/20 text-white hover:bg-white/30"
                )}
                title={isListening ? "Stop listening" : "Speak your message"}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary disabled:opacity-40 transition-opacity"
            >
              {isStreaming
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </form>
        {isListening && (
          <p className="mt-2 text-[11px] text-white/70 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse" />
            Listening — words will appear as you speak
          </p>
        )}

        {/* Decorative circle */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -right-2 top-16 h-24 w-24 rounded-full bg-white/5" />
      </div>

      {/* Quick action chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {[
          { label: "Add event", icon: CalendarPlus, href: "/calendar" },
          { label: "Add task", icon: ListPlus, href: "/tasks" },
          { label: "Plan meal", icon: Utensils, href: "/meals" },
          { label: "Family", icon: Users, href: "/family" },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <button className="flex items-center gap-2 whitespace-nowrap rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted/50 transition-colors">
              <item.icon className="h-4 w-4 text-primary" />
              {item.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Smart suggestions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">Suggested for you</p>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => sendMessage(s.text)}
            className="w-full flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left shadow-sm hover:bg-muted/30 transition-colors"
          >
            {iconFor(s.icon)}
            <span className="text-sm flex-1">{s.text}</span>
            <Send className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>

      {/* Family members */}
      {familyMembers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Household</p>
            <Link href="/family">
              <span className="text-xs text-primary font-medium">Manage</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-0.5">
            {familyMembers.map(member => (
              <div key={member.id} className="flex flex-col items-center gap-1 shrink-0">
                <Avatar className="h-11 w-11 border-2" style={{ borderColor: `hsl(${member.color})` }}>
                  <AvatarFallback style={{ backgroundColor: `hsl(${member.color})`, color: "white" }} className="text-sm font-bold">
                    {member.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-medium text-muted-foreground max-w-[48px] truncate text-center">{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</p>
          <Link href="/calendar">
            <span className="text-xs text-primary font-medium">Calendar</span>
          </Link>
        </div>

        {todayEvents.length === 0 && todayMeals.length === 0 ? (
          <div className="rounded-xl border bg-card px-4 py-5 text-center">
            <p className="text-sm text-muted-foreground">Nothing scheduled yet — ask the AI to help plan your day</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.slice(0, 3).map(event => (
              <div key={event.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
                <div
                  className="h-9 w-1 rounded-full shrink-0"
                  style={{ backgroundColor: event.color?.startsWith("#") ? event.color : `hsl(${event.color || "252 84% 62%"})` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.allDay ? "All day" : format(parseISO(event.startTime), "h:mm a")}
                  </p>
                </div>
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
            {todayMeals.map(meal => (
              <div key={meal.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Utensils className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{meal.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{meal.mealType}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending tasks */}
      {tasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Things To Do</p>
            <Link href="/tasks">
              <span className="text-xs text-primary font-medium">View all</span>
            </Link>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 4).map(task => {
              const member = familyMembers.find(m => m.id === task.familyMemberId);
              return (
                <div key={task.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-4 px-1.5",
                          task.priority === "high" && "border-red-200 bg-red-50 text-red-600",
                          task.priority === "medium" && "border-amber-200 bg-amber-50 text-amber-600",
                          task.priority === "low" && "border-green-200 bg-green-50 text-green-600",
                        )}
                      >
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(task.dueDate), "MMM d")}
                        </span>
                      )}
                      {member && (
                        <Avatar className="h-4 w-4">
                          <AvatarFallback style={{ backgroundColor: `hsl(${member.color})`, color: "white" }} className="text-[8px]">
                            {member.avatarInitials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </div>
              );
            })}
            {tasks.length > 4 && (
              <Link href="/tasks">
                <button className="w-full text-center text-xs text-primary font-medium py-2">
                  +{tasks.length - 4} more tasks
                </button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
