import { useState, useMemo } from "react";
import { useListTasks, useCreateTask, useUpdateTask, useDeleteTask, useListFamilyMembers, getListTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Task, CreateTaskBody, CreateTaskBodyPriority, CreateTaskBodyCategory, UpdateTaskBody } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { Plus, Calendar, ArrowUpDown, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const priorities: CreateTaskBodyPriority[] = ["low", "medium", "high"];
const categories: CreateTaskBodyCategory[] = ["household", "school", "errands", "health", "work", "other"];

type SortKey = "default" | "dueDate_asc" | "dueDate_desc" | "member";

export default function Tasks() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("default");

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useListTasks({
    completed: activeTab === "completed" ? true : activeTab === "pending" ? false : undefined,
  });

  const { data: familyMembers = [] } = useListFamilyMembers();

  const createTaskMutation = useCreateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        setIsDialogOpen(false);
        toast.success("Task created successfully");
      },
      onError: () => {
        toast.error("Failed to create task");
      }
    }
  });

  const updateTaskMutation = useUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        setIsDialogOpen(false);
        toast.success("Task updated");
      },
      onError: () => {
        toast.error("Failed to update task");
      }
    }
  });

  const deleteTaskMutation = useDeleteTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        toast.success("Task deleted");
      },
      onError: () => {
        toast.error("Failed to delete task");
      }
    }
  });

  const form = useForm<CreateTaskBody>({
    defaultValues: {
      title: "",
      notes: "",
      dueDate: undefined,
      priority: "medium",
      category: "household",
      familyMemberId: undefined,
    }
  });

  const handleCreateClick = () => {
    setSelectedTask(null);
    form.reset({
      title: "",
      notes: "",
      dueDate: undefined,
      priority: "medium",
      category: "household",
      familyMemberId: undefined,
    });
    setIsDialogOpen(true);
  };

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    form.reset({
      title: task.title,
      notes: task.notes || "",
      dueDate: task.dueDate,
      priority: task.priority as CreateTaskBodyPriority,
      category: task.category as CreateTaskBodyCategory,
      familyMemberId: task.familyMemberId,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: CreateTaskBody) => {
    if (selectedTask) {
      updateTaskMutation.mutate({ id: selectedTask.id, data: data as UpdateTaskBody });
    } else {
      createTaskMutation.mutate({ data });
    }
  };

  const toggleComplete = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { completed: !task.completed }
    });
  };

  const handleDelete = (id: number) => {
    deleteTaskMutation.mutate({ id });
  };

  const getMember = (id?: number) => familyMembers.find(m => m.id === id);

  const sortedTasks = useMemo(() => {
    const copy = [...tasks];
    if (sortKey === "dueDate_asc") {
      copy.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortKey === "dueDate_desc") {
      copy.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      });
    } else if (sortKey === "member") {
      copy.sort((a, b) => {
        const nameA = getMember(a.familyMemberId)?.name ?? "zzz";
        const nameB = getMember(b.familyMemberId)?.name ?? "zzz";
        return nameA.localeCompare(nameB);
      });
    }
    return copy;
  }, [tasks, sortKey, familyMembers]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage family chores and responsibilities.</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowUpDown className="h-4 w-4" />
          <span>Sort:</span>
        </div>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="dueDate_asc">Due Date (soonest)</SelectItem>
            <SelectItem value="dueDate_desc">Due Date (latest)</SelectItem>
            <SelectItem value="member">Family Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sortedTasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No tasks found. Click "Add Task" to create one.
                </CardContent>
              </Card>
            ) : (
              sortedTasks.map((task) => {
                const member = getMember(task.familyMemberId);
                return (
                  <Card key={task.id} className={`hover:shadow-md transition-shadow ${task.completed ? "opacity-60" : ""}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleComplete(task)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0" onClick={() => handleEditClick(task)}>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </h3>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider px-1.5 py-0 h-5">
                            {task.category}
                          </Badge>
                        </div>
                        {task.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                            {task.notes}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(parseISO(task.dueDate), "MMM d, yyyy")}</span>
                            </div>
                          )}
                          {member && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-5 w-5 border">
                                <AvatarFallback style={{ backgroundColor: `hsl(${member.color})`, color: "white" }} className="text-[10px]">
                                  {member.avatarInitials}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(task.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedTask ? "Edit Task" : "Create Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...form.register("title", { required: true })} placeholder="What needs to be done?" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select
                    value={form.watch("priority")}
                    onValueChange={(val: CreateTaskBodyPriority) => form.setValue("priority", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(p => (
                        <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(val: CreateTaskBodyCategory) => form.setValue("category", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...form.register("dueDate")}
                    value={form.watch("dueDate") ? format(parseISO(form.watch("dueDate")!), "yyyy-MM-dd") : ""}
                    onChange={(e) => form.setValue("dueDate", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Assign To</Label>
                  <Select
                    value={form.watch("familyMemberId")?.toString() ?? "none"}
                    onValueChange={(val) => form.setValue("familyMemberId", val === "none" ? undefined : parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Family member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {familyMembers.map(member => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${member.color})` }} />
                            {member.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...form.register("notes")} placeholder="Additional details..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createTaskMutation.isPending || updateTaskMutation.isPending}>
                {selectedTask ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
