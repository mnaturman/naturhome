import { useState } from "react";
import { format, startOfWeek, addDays, subWeeks, addWeeks, isToday } from "date-fns";
import {
  useListMeals,
  useCreateMeal,
  useUpdateMeal,
  useDeleteMeal,
  getListMealsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { MealMealType, CreateMealBody } from "@workspace/api-client-react";

const MEAL_TYPES: MealMealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function Meals() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<CreateMealBody>>({
    name: "",
    mealType: "breakfast",
    date: "",
    notes: "",
  });

  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const { data: meals, isLoading } = useListMeals({
    weekOf: format(startDate, "yyyy-MM-dd"),
  });

  const createMealMutation = useCreateMeal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
        setIsDialogOpen(false);
        toast({ title: "Meal saved" });
      },
    },
  });

  const updateMealMutation = useUpdateMeal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
        setIsDialogOpen(false);
        toast({ title: "Meal updated" });
      },
    },
  });

  const deleteMealMutation = useDeleteMeal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
        setIsDialogOpen(false);
        toast({ title: "Meal deleted" });
      },
    },
  });

  const handleOpenDialog = (date: Date, mealType: MealMealType, meal?: any) => {
    if (meal) {
      setSelectedMeal(meal);
      setFormData({ name: meal.name, mealType: meal.mealType, date: meal.date, notes: meal.notes || "" });
    } else {
      setSelectedMeal(null);
      setFormData({ name: "", mealType, date: format(date, "yyyy-MM-dd"), notes: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.mealType) return;
    const data = formData as CreateMealBody;
    if (selectedMeal) {
      updateMealMutation.mutate({ id: selectedMeal.id, data });
    } else {
      createMealMutation.mutate({ data });
    }
  };

  // Server returns dates as "YYYY-MM-DD" strings — compare directly to avoid timezone issues
  const getMealAt = (date: Date, mealType: MealMealType) =>
    meals?.find(m =>
      m.mealType === mealType &&
      m.date.slice(0, 10) === format(date, "yyyy-MM-dd")
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meals</h1>
          <p className="text-muted-foreground">Week of {format(startDate, "MMMM d, yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <div className="min-w-[640px]">
          {/* Header row */}
          <div className="grid grid-cols-[88px_repeat(7,1fr)] border-b bg-muted/30">
            <div className="p-3 border-r" />
            {weekDays.map((day) => {
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`p-3 text-center border-r last:border-r-0 ${today ? "bg-primary/5" : ""}`}
                >
                  <div className={`text-sm font-semibold ${today ? "text-primary" : ""}`}>
                    {format(day, "EEE")}
                  </div>
                  <div className={`text-xs ${today ? "text-primary/80 font-medium" : "text-muted-foreground"}`}>
                    {format(day, "MMM d")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Meal rows */}
          {MEAL_TYPES.map((mealType, mIdx) => (
            <div
              key={mealType}
              className={`grid grid-cols-[88px_repeat(7,1fr)] ${mIdx < MEAL_TYPES.length - 1 ? "border-b" : ""}`}
            >
              <div className="p-3 border-r flex items-center justify-center bg-muted/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                  {mealType}
                </span>
              </div>
              {weekDays.map((day) => {
                const meal = getMealAt(day, mealType);
                const today = isToday(day);
                return (
                  <button
                    key={`${day.toISOString()}-${mealType}`}
                    type="button"
                    onClick={() => handleOpenDialog(day, mealType, meal)}
                    className={`min-h-[88px] p-2.5 text-left border-r last:border-r-0 transition-colors
                      ${today ? "bg-primary/5" : "bg-background"}
                      ${meal ? "hover:bg-primary/10" : "hover:bg-muted/40"}`}
                  >
                    {meal ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-snug line-clamp-2">{meal.name}</p>
                        {meal.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{meal.notes}</p>
                        )}
                      </div>
                    ) : (
                      <div className="h-full min-h-[64px] flex items-center justify-center">
                        <Plus className="h-4 w-4 text-muted-foreground/25" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMeal ? "Edit Meal" : "Add Meal"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Meal Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="What are we eating?"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Meal Type</Label>
                <Select
                  value={formData.mealType}
                  onValueChange={(value: MealMealType) => setFormData({ ...formData, mealType: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions or ingredients?"
              />
            </div>
            <DialogFooter className="flex items-center justify-between sm:justify-between">
              {selectedMeal && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMealMutation.mutate({ id: selectedMeal.id })}
                  disabled={deleteMealMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMealMutation.isPending || updateMealMutation.isPending}>
                  {selectedMeal ? "Update" : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
