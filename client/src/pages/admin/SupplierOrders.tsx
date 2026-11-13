import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, ArrowUpDown, ArrowUp, ArrowDown, Plus, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { NewSupplierOrderDialog } from "@/components/admin/NewSupplierOrderDialog";

type SupplierOrderWithLines = {
  id: number;
  supplierId: number;
  orderDate: string;
  confirmed: boolean;
  confirmationDate: string | null;
  remark: string | null;
  supplier: {
    id: number;
    name: string;
  } | null;
  orderLines: Array<{
    id: number;
    supplierOrderId: number;
    productId: number;
    quantity: string;
    product: {
      id: number;
      name: string;
    };
    buyingPrice: {
      id: number;
      price: string;
      currency: string;
      productUnit: string;
      validFrom: string;
      validUntil: string;
    } | null;
  }>;
};

type SortField = "orderDate" | "supplierName" | "confirmed";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function SupplierOrders() {
  const [sortField, setSortField] = useState<SortField>("orderDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: orders, isLoading } = useQuery<SupplierOrderWithLines[]>({
    queryKey: ["/api/supplier-orders"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/supplier-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      toast({
        title: "Success",
        description: "Supplier order deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete supplier order",
        variant: "destructive",
      });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = orders.filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      const supplierName = order.supplier?.name?.toLowerCase() || "";
      const orderDate = format(parseISO(order.orderDate), "dd/MM/yyyy");

      return (
        supplierName.includes(searchLower) ||
        orderDate.includes(searchLower) ||
        order.id.toString().includes(searchLower)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "orderDate":
          aVal = new Date(a.orderDate).getTime();
          bVal = new Date(b.orderDate).getTime();
          break;
        case "supplierName":
          aVal = a.supplier?.name || "";
          bVal = b.supplier?.name || "";
          break;
        case "confirmed":
          aVal = a.confirmed ? 1 : 0;
          bVal = b.confirmed ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [orders, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handleDeleteOrder = async () => {
    if (deleteOrderId) {
      await deleteMutation.mutateAsync(deleteOrderId);
      setDeleteOrderId(null);
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const SortIcon = () => {
      if (sortField !== field) {
        return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
      }
      return sortDirection === "asc" ? (
        <ArrowUp className="ml-1 h-3 w-3" />
      ) : (
        <ArrowDown className="ml-1 h-3 w-3" />
      );
    };

    return (
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className="hover:bg-transparent p-0 h-auto font-semibold"
      >
        {children}
        <SortIcon />
      </Button>
    );
  };

  return (
    <AdminLayout>
      <div className="row mb-4">
        <div className="col-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-serif text-3xl font-semibold mb-2">Supplier Orders</h1>
              <p className="text-muted-foreground">
                Manage orders from suppliers
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Supplier Orders</CardTitle>
                <Button onClick={() => setShowNewOrderDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Controls Row */}
              <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Search:</span>
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-64"
                  />
                </div>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <p className="text-muted-foreground">Loading orders...</p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "No orders found matching your search" : "No supplier orders yet"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th className="text-center">
                            <Button
                              variant="ghost"
                              className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                            >
                              Order #
                            </Button>
                          </th>
                          <th>
                            <SortButton field="supplierName">Supplier</SortButton>
                          </th>
                          <th>
                            <SortButton field="orderDate">Order Date</SortButton>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                            >
                              Items
                            </Button>
                          </th>
                          <th>
                            <SortButton field="confirmed">Status</SortButton>
                          </th>
                          <th className="text-right">
                            <Button
                              variant="ghost"
                              className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                            >
                              Actions
                            </Button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOrders.map((order) => (
                          <tr 
                            key={order.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setLocation(`/admin/supplier-orders/${order.id}`)}
                            data-testid={`row-order-${order.id}`}
                          >
                            <td className="text-center">
                              <span className="font-mono text-sm">#{order.id}</span>
                            </td>
                            <td>
                              <span className="font-medium">{order.supplier?.name || "Unknown"}</span>
                            </td>
                            <td>
                              {format(parseISO(order.orderDate), "dd/MM/yyyy")}
                            </td>
                            <td>
                              {order.orderLines.length} items
                            </td>
                            <td>
                              {order.confirmed ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Confirmed
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="text-right">
                              {!order.confirmed && (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocation(`/admin/supplier-orders/${order.id}`);
                                    }}
                                    data-testid={`button-edit-${order.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteOrderId(order.id);
                                    }}
                                    data-testid={`button-delete-${order.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

                  {/* Pagination Footer */}
                  <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showNewOrderDialog && (
        <NewSupplierOrderDialog
          open={showNewOrderDialog}
          onOpenChange={setShowNewOrderDialog}
        />
      )}

      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this supplier order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
