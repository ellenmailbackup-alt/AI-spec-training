import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Package, Trash2, Calendar, Edit2, ClipboardList, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { MultiUnitEntryDialog } from "@/components/admin/MultiUnitEntryDialog";
import { VarianceAnalysisTable } from "@/components/admin/VarianceAnalysisTable";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/currency";
import type { CountingSession } from "@shared/schema";
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

type CountingSessionRecord = {
  id: number;
  productId: number;
  productName: string;
  locationId: number;
  locationName: string | null;
  countedQuantity: string;
  inventoryStatus: string;
  expiryDate: string | null;
  batchNumber: string | null;
  countedAt: string;
  unit: string;
};

// Helper to format unit display
const formatUnitLabel = (unit: string, quantity: number): string => {
  const isPiece = unit.toLowerCase() === "stuk";
  if (isPiece) {
    return quantity === 1 ? "stuk" : "stuks";
  }
  return "g";
};

// Helper to format quantity with unit
const formatQuantityWithUnit = (quantity: number, unit: string): string => {
  const isPiece = unit.toLowerCase() === "stuk";
  if (isPiece) {
    return `${Math.round(quantity)} ${formatUnitLabel(unit, quantity)}`;
  }
  return `${formatNumber(quantity, 2)} g`;
};

// Status badge styling
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'in stock':
    case 'in_stock':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'in use':
    case 'in_use':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const formatStatus = (status: string) => {
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function CountingSessionDetail() {
  const params = useParams();
  const sessionId = parseInt(params.id || "0");
  const { toast } = useToast();

  // Parse tab query parameter from URL
  const queryParams = new URLSearchParams(window.location.search);
  const tabParam = queryParams.get('tab');
  const initialTab = tabParam === 'variance-analysis' ? 'variance-analysis' : 'count-entry';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CountingSessionRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<CountingSessionRecord | null>(null);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);

  // Fetch session details
  const { data: session, isLoading: sessionLoading } = useQuery<CountingSession>({
    queryKey: [`/api/counting-sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Fetch session records
  const { data: records = [], isLoading: recordsLoading } = useQuery<CountingSessionRecord[]>({
    queryKey: [`/api/counting-sessions/${sessionId}/records`],
    enabled: !!sessionId,
  });

  // Create record mutation
  const createRecordMutation = useMutation({
    mutationFn: async (data: {
      productId: number;
      locationId: number;
      countedQuantity: number;
      inventoryStatus: string;
      dueDate?: string;
      notes?: string;
    }) => {
      return await apiRequest("POST", `/api/counting-sessions/${sessionId}/records`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/counting-sessions/${sessionId}/records`] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Count entry added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add count entry",
        variant: "destructive",
      });
    },
  });

  // Update record mutation
  const updateRecordMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      countedQuantity: number;
      inventoryStatus: string;
      dueDate?: string;
      notes?: string;
    }) => {
      return await apiRequest("PUT", `/api/counting-session-records/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/counting-sessions/${sessionId}/records`] });
      setEditingRecord(null);
      toast({
        title: "Success",
        description: "Count entry updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update count entry",
        variant: "destructive",
      });
    },
  });

  // Delete record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: number) => {
      return await apiRequest("DELETE", `/api/counting-session-records/${recordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/counting-sessions/${sessionId}/records`] });
      setDeletingRecord(null);
      toast({
        title: "Success",
        description: "Count entry deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete count entry",
        variant: "destructive",
      });
    },
  });

  const finalizeSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/counting-sessions/${sessionId}/finalize`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/counting-sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/counting-sessions/${sessionId}/records`] });
      queryClient.invalidateQueries({ queryKey: [`/api/counting-sessions/${sessionId}/variance-analysis`] });
      setIsFinalizeDialogOpen(false);
      toast({
        title: "Session Finalized",
        description: "Inventory counts have been committed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to finalize counting session",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (productId: number, locationId: number, totalGrams: number, inventoryStatus: string, dueDate?: string, notes?: string) => {
    if (editingRecord) {
      // Update existing record
      updateRecordMutation.mutate({
        id: editingRecord.id,
        productId,
        locationId,
        countedQuantity: totalGrams,
        inventoryStatus,
        dueDate,
        notes,
      });
    } else {
      // Create new record
      createRecordMutation.mutate({
        productId,
        locationId,
        countedQuantity: totalGrams,
        inventoryStatus,
        dueDate,
        notes,
      });
    }
  };

  // Group records by product
  const recordsByProduct = records.reduce((acc, record) => {
    const key = record.productId;
    if (!acc[key]) {
      acc[key] = {
        productId: record.productId,
        productName: record.productName,
        records: [],
        total: 0,
        unit: record.unit || "gram",
      };
    }
    acc[key].records.push(record);
    acc[key].total += parseFloat(record.countedQuantity);
    return acc;
  }, {} as Record<number, { productId: number; productName: string; records: CountingSessionRecord[]; total: number; unit: string }>);

  if (sessionLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading session details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!session) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Session Not Found</h2>
          <p className="text-gray-600 mt-2">The counting session you're looking for doesn't exist.</p>
          <Link href="/admin/counting-sessions">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/counting-sessions">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{session.sessionName}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Started {format(new Date(session.startedAt), "MMM d, yyyy 'at' HH:mm")}
                </div>
                <div className="flex items-center gap-1">
                  Status: <span className="font-medium">{session.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
          {session.status === "open" && (
            <div className="flex items-center gap-2">
              <Button variant="destructive" onClick={() => setIsFinalizeDialogOpen(true)}>
                Finalize Session
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Count Entry
              </Button>
            </div>
          )}
        </div>

        {/* Session Info */}
        {session.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Session Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{session.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Count Entry and Variance Analysis */}
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="count-entry" className="flex items-center gap-2" data-testid="tab-count-entry">
              <ClipboardList className="w-4 h-4" />
              Count Entry
            </TabsTrigger>
            <TabsTrigger value="variance-analysis" className="flex items-center gap-2" data-testid="tab-variance-analysis">
              <BarChart3 className="w-4 h-4" />
              Variance Analysis
            </TabsTrigger>
          </TabsList>

          {/* Count Entry Tab */}
          <TabsContent value="count-entry" className="space-y-6">
            {/* Records Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Count Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total Products</div>
                    <div className="text-2xl font-bold">{Object.keys(recordsByProduct).length}</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total Entries</div>
                    <div className="text-2xl font-bold">{records.length}</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="text-2xl font-bold capitalize">{session.status}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Records by Product - Compact Table Layout */}
            <Card>
              <CardHeader>
                <CardTitle>Counted Items ({records.length} entries)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {records.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No items counted yet. Click "Add Count Entry" to start counting.
                  </div>
                ) : (
                  <div className="divide-y">
                    {Object.values(recordsByProduct)
                      .sort((a, b) => a.productName.localeCompare(b.productName))
                      .map((productGroup) => (
                      <div key={productGroup.productId}>
                        {/* Product Header Row */}
                        <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{productGroup.productName}</span>
                          </div>
                          <div className="font-bold text-primary">
                            {formatQuantityWithUnit(productGroup.total, productGroup.unit)}
                          </div>
                        </div>
                        
                        {/* Compact Table Rows */}
                        <table className="w-full text-sm table-fixed">
                          <thead className="bg-muted/30">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-muted-foreground" style={{ width: '15%' }}>Quantity</th>
                              <th className="px-4 py-2 text-left font-medium text-muted-foreground" style={{ width: '15%' }}>Location</th>
                              <th className="px-4 py-2 text-left font-medium text-muted-foreground" style={{ width: '12%' }}>Status</th>
                              <th className="px-4 py-2 text-left font-medium text-muted-foreground" style={{ width: '15%' }}>Expiry</th>
                              <th className="px-4 py-2 text-left font-medium text-muted-foreground" style={{ width: session.status === "open" ? '33%' : '43%' }}>Batch/Notes</th>
                              {session.status === "open" && (
                                <th className="px-4 py-2 text-right font-medium text-muted-foreground" style={{ width: '10%' }}>Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {productGroup.records.map((record) => (
                              <tr key={record.id} className="hover:bg-muted/20">
                                <td className="px-4 py-2 font-medium">
                                  {formatQuantityWithUnit(parseFloat(record.countedQuantity), record.unit)}
                                </td>
                                <td className="px-4 py-2">{record.locationName || "-"}</td>
                                <td className="px-4 py-2">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(record.inventoryStatus.toLowerCase())}`}>
                                    {formatStatus(record.inventoryStatus)}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-muted-foreground">
                                  {record.expiryDate ? format(new Date(record.expiryDate), "MMM d, yyyy") : "-"}
                                </td>
                                <td className="px-4 py-2 text-muted-foreground">{record.batchNumber || "-"}</td>
                                {session.status === "open" && (
                                  <td className="px-4 py-2 text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingRecord(record)}
                                        data-testid={`button-edit-record-${record.id}`}
                                      >
                                        <Edit2 className="w-4 h-4 text-blue-500" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeletingRecord(record)}
                                        data-testid={`button-delete-record-${record.id}`}
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variance Analysis Tab */}
          <TabsContent value="variance-analysis">
            <VarianceAnalysisTable
              sessionId={sessionId}
              onEdit={(productId) => {
                // TODO: Implement edit functionality
                console.log("Edit product:", productId);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Entry Dialog */}
      <MultiUnitEntryDialog
        open={isDialogOpen || !!editingRecord}
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingRecord(null);
          }
        }}
        onSubmit={handleSubmit}
        sessionId={sessionId}
        isSubmitting={createRecordMutation.isPending || updateRecordMutation.isPending}
        existingRecord={editingRecord ? {
          id: editingRecord.id,
          productId: editingRecord.productId,
          productName: editingRecord.productName,
          locationId: editingRecord.locationId,
          countedQuantity: editingRecord.countedQuantity,
          inventoryStatus: editingRecord.inventoryStatus,
          dueDate: editingRecord.expiryDate,
          notes: editingRecord.batchNumber,
        } : null}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingRecord} onOpenChange={() => setDeletingRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Count Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this count entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRecord && deleteRecordMutation.mutate(deletingRecord.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will commit the counts, update inventory availability, and create correction movements.
              The session will become read-only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={finalizeSessionMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => finalizeSessionMutation.mutate()}
              disabled={finalizeSessionMutation.isPending}
            >
              {finalizeSessionMutation.isPending ? "Finalizing..." : "Finalize Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
