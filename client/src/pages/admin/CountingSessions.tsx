import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, User, FileText, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { CountingSessionDialog } from "@/components/admin/CountingSessionDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { CountingSession } from "@shared/schema";

type SortField = 'startedAt' | 'sessionName' | 'status';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// Status badge styling
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open':
      return <Clock className="w-4 h-4" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'cancelled':
      return <XCircle className="w-4 h-4" />;
    default:
      return null;
  }
};

export default function CountingSessions() {
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('startedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch counting sessions
  const { data: sessions = [], isLoading } = useQuery<CountingSession[]>({
    queryKey: ["/api/counting-sessions"],
  });

  // Create mutation
  const createSessionMutation = useMutation({
    mutationFn: async (values: any) => {
      return await apiRequest("POST", "/api/counting-sessions", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/counting-sessions"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Counting session created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create counting session",
        variant: "destructive",
      });
    },
  });

  // Filter sessions based on search and status
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        session.sessionName.toLowerCase().includes(search) ||
        (session.notes || '').toLowerCase().includes(search) ||
        session.id.toString().includes(search);

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== "all") {
        return session.status === statusFilter;
      }

      return true;
    });
  }, [sessions, searchTerm, statusFilter]);

  // Sort sessions
  const sortedSessions = useMemo(() => {
    const sorted = [...filteredSessions];
    sorted.sort((a, b) => {
      let aVal: string | number | Date;
      let bVal: string | number | Date;

      if (sortField === 'startedAt') {
        aVal = new Date(a.startedAt).getTime();
        bVal = new Date(b.startedAt).getTime();
      } else if (sortField === 'sessionName') {
        aVal = a.sessionName.toLowerCase();
        bVal = b.sessionName.toLowerCase();
      } else {
        aVal = a.status;
        bVal = b.status;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const comparison = aVal.toString().localeCompare(bVal.toString());
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredSessions, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);
  const paginatedSessions = sortedSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = (values: any) => {
    createSessionMutation.mutate(values);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading counting sessions...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Counting Sessions</h1>
            <p className="text-gray-600 mt-1">
              Organize inventory counting into manageable batches
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Sessions ({sortedSessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, notes, or ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {paginatedSessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "No sessions match your filters"
                  : "No counting sessions yet. Create your first session to get started!"}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-3 font-semibold">ID</th>
                        <th
                          className="text-left p-3 font-semibold cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('sessionName')}
                        >
                          Session Name
                          {sortField === 'sessionName' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th
                          className="text-left p-3 font-semibold cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('status')}
                        >
                          Status
                          {sortField === 'status' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th
                          className="text-left p-3 font-semibold cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('startedAt')}
                        >
                          Started At
                          {sortField === 'startedAt' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th className="text-left p-3 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSessions.map((session) => (
                        <tr key={session.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-gray-600">#{session.id}</td>
                          <td className="p-3">
                            <Link href={`/admin/counting-sessions/${session.id}`}>
                              <div className="flex items-center gap-2 font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                                {session.sessionName}
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </Link>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(session.status)}`}
                            >
                              {getStatusIcon(session.status)}
                              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(session.startedAt), "MMM d, yyyy 'at' HH:mm")}
                            </div>
                          </td>
                          <td className="p-3 text-gray-600 max-w-xs truncate">
                            {session.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Items per page:</span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(parseInt(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option.toString()}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600 ml-4">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, sortedSessions.length)} of{' '}
                        {sortedSessions.length}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            onClick={() => setCurrentPage(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <CountingSessionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        title="Create New Counting Session"
        description="Start a new inventory counting session. Give it a descriptive name to identify the area or batch you're counting."
        isSubmitting={createSessionMutation.isPending}
      />
    </AdminLayout>
  );
}
