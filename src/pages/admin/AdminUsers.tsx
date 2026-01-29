import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, MoreHorizontal, Shield, ShieldCheck, User, Loader2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type UserType = Database["public"]["Enums"]["user_type"];

interface UserWithRoles {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  user_type: UserType;
  created_at: string | null;
  roles: AppRole[];
}

const roleLabels: Record<AppRole, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { label: "Admin", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <ShieldCheck className="w-3 h-3" /> },
  moderator: { label: "Moderator", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: <Shield className="w-3 h-3" /> },
  user: { label: "User", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <User className="w-3 h-3" /> },
};

const userTypeLabels: Record<UserType, string> = {
  welder: "Welder",
  employer: "Employer",
  admin: "Admin",
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    role: AppRole;
    action: "add" | "remove";
    userName: string;
  } | null>(null);

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, user_type, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        ...profile,
        roles: (allRoles || [])
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role),
      }));

      return usersWithRoles;
    },
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add role: ${error.message}`);
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });

  const handleRoleAction = (userId: string, role: AppRole, action: "add" | "remove", userName: string) => {
    setConfirmDialog({ open: true, userId, role, action, userName });
  };

  const confirmRoleAction = () => {
    if (!confirmDialog) return;
    
    if (confirmDialog.action === "add") {
      addRoleMutation.mutate({ userId: confirmDialog.userId, role: confirmDialog.role });
    } else {
      removeRoleMutation.mutate({ userId: confirmDialog.userId, role: confirmDialog.role });
    }
    setConfirmDialog(null);
  };

  // Filter users based on search
  const filteredUsers = users?.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower) ||
      user.user_type.toLowerCase().includes(searchLower)
    );
  });

  const getAvailableRolesToAdd = (currentRoles: AppRole[]): AppRole[] => {
    const allRoles: AppRole[] = ["admin", "moderator", "user"];
    return allRoles.filter((role) => !currentRoles.includes(role));
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">View and manage user roles across the platform</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              {users?.length || 0} users
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || "Unnamed User"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{userTypeLabels[user.user_type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-muted-foreground text-sm">No roles</span>
                        ) : (
                          user.roles.map((role) => (
                            <Badge key={role} variant="outline" className={roleLabels[role].color}>
                              <span className="flex items-center gap-1">
                                {roleLabels[role].icon}
                                {roleLabels[role].label}
                              </span>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage Roles</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {/* Add roles */}
                          {getAvailableRolesToAdd(user.roles).length > 0 && (
                            <>
                              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                Add Role
                              </DropdownMenuLabel>
                              {getAvailableRolesToAdd(user.roles).map((role) => (
                                <DropdownMenuItem
                                  key={`add-${role}`}
                                  onClick={() => handleRoleAction(user.id, role, "add", user.full_name || "User")}
                                >
                                  <span className="flex items-center gap-2">
                                    {roleLabels[role].icon}
                                    Add {roleLabels[role].label}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                            </>
                          )}

                          {/* Remove roles */}
                          {user.roles.length > 0 && (
                            <>
                              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                Remove Role
                              </DropdownMenuLabel>
                              {user.roles.map((role) => (
                                <DropdownMenuItem
                                  key={`remove-${role}`}
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleRoleAction(user.id, role, "remove", user.full_name || "User")}
                                >
                                  <span className="flex items-center gap-2">
                                    {roleLabels[role].icon}
                                    Remove {roleLabels[role].label}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === "add" ? "Add Role" : "Remove Role"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmDialog?.action}{" "}
              <span className="font-semibold">{confirmDialog?.role}</span> role{" "}
              {confirmDialog?.action === "add" ? "to" : "from"}{" "}
              <span className="font-semibold">{confirmDialog?.userName}</span>?
              {confirmDialog?.role === "admin" && (
                <span className="block mt-2 text-yellow-600">
                  ⚠️ Admin role grants full system access.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleAction}
              className={confirmDialog?.action === "remove" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {confirmDialog?.action === "add" ? "Add Role" : "Remove Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
