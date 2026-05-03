import { useState } from "react";
import { useListFamilyMembers, useCreateFamilyMember, useUpdateFamilyMember, useDeleteFamilyMember, getListFamilyMembersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { FamilyMember, CreateFamilyMemberBody } from "@workspace/api-client-react";

const COLORS = [
  { name: "Blue", value: "220 70% 50%" },
  { name: "Green", value: "142 71% 45%" },
  { name: "Red", value: "0 84% 60%" },
  { name: "Yellow", value: "48 96% 53%" },
  { name: "Purple", value: "262 83% 58%" },
  { name: "Orange", value: "25 95% 53%" },
  { name: "Pink", value: "330 81% 60%" },
];

const ROLES: { value: CreateFamilyMemberBody["role"]; label: string }[] = [
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "grandparent", label: "Grandparent" },
  { value: "aunt_uncle", label: "Aunt / Uncle" },
  { value: "cousin", label: "Cousin" },
  { value: "other", label: "Other" },
];

function formatRole(role: string) {
  const found = ROLES.find(r => r.value === role);
  return found ? found.label : role;
}

export default function Family() {
  const { data: members, isLoading } = useListFamilyMembers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("other");
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0].value);

  const createMutation = useCreateFamilyMember({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFamilyMembersQueryKey() });
        setIsDialogOpen(false);
        toast({ title: "Family member added" });
      },
    },
  });

  const updateMutation = useUpdateFamilyMember({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFamilyMembersQueryKey() });
        setIsDialogOpen(false);
        setEditingMember(null);
        toast({ title: "Family member updated" });
      },
    },
  });

  const deleteMutation = useDeleteFamilyMember({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFamilyMembersQueryKey() });
        toast({ title: "Family member removed" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreateFamilyMemberBody = {
      name: formData.get("name") as string,
      role: selectedRole as CreateFamilyMemberBody["role"],
      color: selectedColor,
      avatarInitials: formData.get("avatarInitials") as string,
    };

    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const openEditDialog = (member: FamilyMember) => {
    setEditingMember(member);
    setSelectedRole(member.role);
    setSelectedColor(member.color);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingMember(null);
    setSelectedRole("other");
    setSelectedColor(COLORS[0].value);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Members</h1>
          <p className="text-muted-foreground">Manage your family group and their roles.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members?.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2" style={{ borderColor: `hsl(${member.color})` }}>
                  <AvatarFallback style={{ backgroundColor: `hsl(${member.color})`, color: "white" }}>
                    {member.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{formatRole(member.role)}</p>
                </div>
              </div>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2 bg-muted/50 py-3">
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(member)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate({ id: member.id })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingMember ? "Edit Family Member" : "Add Family Member"}</DialogTitle>
              <DialogDescription>
                Fill in the details for the family member.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editingMember?.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="avatarInitials">Initials</Label>
                <Input id="avatarInitials" name="avatarInitials" defaultValue={editingMember?.avatarInitials} maxLength={2} required />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: `hsl(${color.value})` }} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingMember ? "Update" : "Add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
