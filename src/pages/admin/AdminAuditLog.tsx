// pages/admin/AdminAuditLog.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Shield, 
  Eye, 
  Edit, 
  Download, 
  Trash2, 
  Plus, 
  Search,
  Calendar,
  User,
  Table as TableIcon,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuditAction = 'view' | 'reveal' | 'edit' | 'export' | 'create' | 'delete';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: AuditAction;
  table_name: string;
  field_name: string;
  record_id: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const ACTION_ICONS: Record<AuditAction, React.ReactNode> = {
  view: <Eye className="h-4 w-4" />,
  reveal: <Eye className="h-4 w-4 text-amber-500" />,
  edit: <Edit className="h-4 w-4 text-blue-500" />,
  export: <Download className="h-4 w-4 text-purple-500" />,
  create: <Plus className="h-4 w-4 text-green-500" />,
  delete: <Trash2 className="h-4 w-4 text-red-500" />,
};

const ACTION_COLORS: Record<AuditAction, string> = {
  view: "bg-gray-100 text-gray-800",
  reveal: "bg-amber-100 text-amber-800",
  edit: "bg-blue-100 text-blue-800",
  export: "bg-purple-100 text-purple-800",
  create: "bg-green-100 text-green-800",
  delete: "bg-red-100 text-red-800",
};

export default function AdminAuditLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");

  // Fetch audit log entries
  const { data: auditEntries, isLoading, refetch } = useQuery({
    queryKey: ["admin-audit-log", actionFilter, tableFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_audit_log" as any, {
        p_user_id: null,
        p_table_name: tableFilter !== "all" ? tableFilter : null,
        p_record_id: null,
        p_action: actionFilter !== "all" ? actionFilter : null,
        p_start_date: null,
        p_end_date: null,
        p_limit: 200,
      });

      if (error) {
        console.error("Failed to fetch audit log:", error);
        return [];
      }

      return (data || []) as AuditLogEntry[];
    },
  });

  // Fetch user emails for display
  const { data: usersData } = useQuery({
    queryKey: ["admin-users-emails"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_users_with_email");
      if (error) return {};
      
      const emailMap: Record<string, string> = {};
      (data || []).forEach((u: { user_id: string; email: string }) => {
        emailMap[u.user_id] = u.email;
      });
      return emailMap;
    },
  });

  // Filter entries
  const filteredEntries = (auditEntries || []).filter((entry) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      entry.field_name.toLowerCase().includes(searchLower) ||
      entry.table_name.toLowerCase().includes(searchLower) ||
      usersData?.[entry.user_id]?.toLowerCase().includes(searchLower) ||
      entry.action.toLowerCase().includes(searchLower)
    );
  });

  // Get unique tables for filter
  const uniqueTables = [...new Set((auditEntries || []).map((e) => e.table_name))];

  return (
    <AdminLayout>
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Sensitive Data Audit Log</h1>
          <p className="text-muted-foreground">
            Compliance tracking for encrypted field access (SOC 2, GDPR, CCPA)
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by field, table, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="reveal">Reveal</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {uniqueTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{auditEntries?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">
              {auditEntries?.filter((e) => e.action === "reveal").length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Field Reveals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {auditEntries?.filter((e) => e.action === "edit").length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Field Edits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">
              {auditEntries?.filter((e) => e.action === "export").length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Exports</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            Audit Entries
          </CardTitle>
          <CardDescription>
            {filteredEntries.length} entries shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading audit log...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit entries found. Access to encrypted fields will be logged here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Record ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(entry.created_at), "MMM d, yyyy HH:mm:ss")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]">
                          {usersData?.[entry.user_id] || entry.user_id.slice(0, 8) + "..."}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ACTION_COLORS[entry.action]}>
                        <span className="flex items-center gap-1">
                          {ACTION_ICONS[entry.action]}
                          {entry.action}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {entry.table_name}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {entry.field_name}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-mono">
                        {entry.record_id ? entry.record_id.slice(0, 8) + "..." : "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    </AdminLayout>
  );
}
