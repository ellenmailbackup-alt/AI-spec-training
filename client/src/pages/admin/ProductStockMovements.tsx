import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, ArrowUpDown, ArrowUp, ArrowDown, Plus, Edit, Trash2, BarChart3 } from "lucide-react";
import { formatNumber } from "@/lib/currency";
import { format } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { StockMovementDialog } from "@/components/admin/StockMovementDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

type StockMovement = {
  id: number;
  productId: number;
  productName: string;
  date: string;
  quantity: number;
  reasonId: number;
  reasonName: string;
  remark: string | null;
  saleId: number | null;
  orderId: number | null;
  roastId: number | null;
};

type ProductWithRelations = {
  id: number;
  name: string;
  nameDutch: string | null;
};

type SortField = 'date' | 'quantity' | 'reasonName';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function ProductStockMovements() {
  const params = useParams();
  const productId = parseInt(params.id || "0");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Parse query parameters from URL
  const queryParams = new URLSearchParams(window.location.search);
  const returnUrl = queryParams.get('returnUrl');
  const yearParam = queryParams.get('year');

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedYear, setSelectedYear] = useState<string>(yearParam || "all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<StockMovement | null>(null);

  // Handle navigating back to counting session
  const handleBackToVarianceAnalysis = () => {
    if (returnUrl) {
      setLocation(decodeURIComponent(returnUrl));
    }
  };

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery<ProductWithRelations>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  // Fetch available years for this product (for the year dropdown)
  const { data: availableYears = [] } = useQuery<number[]>({
    queryKey: [`/api/stock-movements/years?productId=${productId}`],
    enabled: !!productId,
  });

  // Build the query URL based on selected year
  const movementsQueryUrl = selectedYear === "all" 
    ? `/api/stock-movements?productId=${productId}`
    : `/api/stock-movements?productId=${productId}&year=${selectedYear}`;

  // Fetch stock movements for this product
  const { data: movements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: [movementsQueryUrl],
    enabled: !!productId,
  });

  // Create mutation
  const createMovementMutation = useMutation({
    mutationFn: async (values: any) => {
      return await apiRequest("POST", "/api/stock-movements", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [movementsQueryUrl] });
      queryClient.invalidateQueries({ queryKey: [`/api/stock-movements/years?productId=${productId}`] });
      setIsDialogOpen(false);
      setEditingMovement(null);
      toast({
        title: "Success",
        description: "Stock movement created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create stock movement",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMovementMutation = useMutation({
    mutationFn: async (values: any) => {
      return await apiRequest("PUT", `/api/stock-movements/${editingMovement?.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [movementsQueryUrl] });
      queryClient.invalidateQueries({ queryKey: [`/api/stock-movements/years?productId=${productId}`] });
      setIsDialogOpen(false);
      setEditingMovement(null);
      toast({
        title: "Success",
        description: "Stock movement updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock movement",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMovementMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/stock-movements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [movementsQueryUrl] });
      queryClient.invalidateQueries({ queryKey: [`/api/stock-movements/years?productId=${productId}`] });
      setDeletingMovement(null);
      toast({
        title: "Success",
        description: "Stock movement deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete stock movement",
        variant: "destructive",
      });
    },
  });

  // Filter movements based on search only (year filtering is done server-side now)
  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const search = searchTerm.toLowerCase();
      return (
        movement.reasonName.toLowerCase().includes(search) ||
        (movement.remark || '').toLowerCase().includes(search) ||
        movement.id.toString().includes(search)
      );
    });
  }, [movements, searchTerm]);

  // Sort movements
  const sortedMovements = useMemo(() => {
    const sorted = [...filteredMovements];
    sorted.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortField === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      } else if (sortField === 'quantity') {
        aVal = a.quantity;
        bVal = b.quantity;
      } else {
        aVal = a.reasonName.toLowerCase();
        bVal = b.reasonName.toLowerCase();
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredMovements, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovements = sortedMovements.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4 ml-1" /> :
      <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const handleAddMovement = () => {
    setEditingMovement(null);
    setIsDialogOpen(true);
  };

  const handleEditMovement = (movement: StockMovement) => {
    setEditingMovement(movement);
    setIsDialogOpen(true);
  };

  const handleDeleteMovement = (movement: StockMovement) => {
    setDeletingMovement(movement);
  };

  const confirmDelete = () => {
    if (deletingMovement) {
      deleteMovementMutation.mutate(deletingMovement.id);
    }
  };

  const handleSubmitMovement = (values: any) => {
    if (editingMovement) {
      updateMovementMutation.mutate(values);
    } else {
      createMovementMutation.mutate(values);
    }
  };

  const getReferencePath = (movement: StockMovement): string | null => {
    if (movement.saleId) return `/admin/orders/${movement.saleId}`;
    if (movement.orderId) return `/admin/orders/${movement.orderId}`;
    if (movement.roastId) return `/admin/roasts`;
    return null;
  };

  if (productLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-destructive">Product not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {returnUrl ? (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleBackToVarianceAnalysis}
                  data-testid="button-back-variance"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Back to Variance Analysis
                </Button>
              ) : (
                <Link href={`/admin/products/${productId}`}>
                  <Button variant="ghost" size="sm" data-testid="button-back">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Product
                  </Button>
                </Link>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              Stock Movements
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-product-name">
              {product.name} {product.nameDutch ? `(${product.nameDutch})` : ''}
            </p>
          </div>
        </div>

        {/* Stock Movements Table */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>All Stock Movements</CardTitle>
              <Button onClick={handleAddMovement} data-testid="button-add-movement">
                <Plus className="w-4 h-4 mr-2" />
                Add Stock Movement
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Controls Row */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20" data-testid="select-items-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map(option => (
                        <SelectItem key={option} value={option.toString()}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Year:</span>
                  <Select
                    value={selectedYear}
                    onValueChange={(value) => {
                      setSelectedYear(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-32" data-testid="select-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Search:</span>
                <Input
                  type="text"
                  placeholder="Search movements..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-64"
                  data-testid="input-search"
                />
              </div>
            </div>

            {movementsLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading stock movements...</p>
                </div>
              </div>
            ) : paginatedMovements.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  {searchTerm ? 'No movements found matching your search' : 'No stock movements yet'}
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>
                          <Button
                            variant="ghost"
                            className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                          >
                            #
                          </Button>
                        </th>
                        <th>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('date')}
                            className="hover:bg-transparent p-0 h-auto font-semibold"
                            data-testid="header-date"
                          >
                            Date
                            <SortIcon field="date" />
                          </Button>
                        </th>
                        <th>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('reasonName')}
                            className="hover:bg-transparent p-0 h-auto font-semibold"
                            data-testid="header-reason"
                          >
                            Reason
                            <SortIcon field="reasonName" />
                          </Button>
                        </th>
                        <th>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('quantity')}
                            className="hover:bg-transparent p-0 h-auto font-semibold"
                            data-testid="header-quantity"
                          >
                            Quantity (g)
                            <SortIcon field="quantity" />
                          </Button>
                        </th>
                        <th>
                          <Button
                            variant="ghost"
                            className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                          >
                            Remark
                          </Button>
                        </th>
                        <th>
                          <Button
                            variant="ghost"
                            className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                          >
                            References
                          </Button>
                        </th>
                        <th>
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
                      {paginatedMovements.map((movement) => {
                        const referencePath = getReferencePath(movement);
                        return (
                          <tr
                            key={movement.id}
                            data-testid={`row-movement-${movement.id}`}
                          >
                            <td className="font-mono text-sm">{movement.id}</td>
                            <td className="font-medium">
                              {format(new Date(movement.date), 'dd/MM/yyyy')}
                            </td>
                            <td>
                              <span className="font-medium">{movement.reasonName}</span>
                            </td>
                            <td className={`font-mono text-sm ${movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {movement.quantity >= 0 ? '+' : ''}{formatNumber(movement.quantity)}
                            </td>
                            <td className="text-muted-foreground text-sm">{movement.remark || '-'}</td>
                            <td className="text-sm">
                              {movement.saleId && (
                                <Link href={`/admin/orders/${movement.saleId}`}>
                                  <button className="text-blue-600 hover:underline hover:text-blue-800">
                                    Sale #{movement.saleId}
                                  </button>
                                </Link>
                              )}
                              {movement.orderId && (
                                <Link href={`/admin/orders/${movement.orderId}`}>
                                  <button className="text-blue-600 hover:underline hover:text-blue-800">
                                    Order #{movement.orderId}
                                  </button>
                                </Link>
                              )}
                              {movement.roastId && (
                                <Link href={`/admin/roasts`}>
                                  <button className="text-blue-600 hover:underline hover:text-blue-800">
                                    Roast #{movement.roastId}
                                  </button>
                                </Link>
                              )}
                              {!movement.saleId && !movement.orderId && !movement.roastId && (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                  onClick={() => handleEditMovement(movement)}
                                  data-testid={`button-edit-${movement.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteMovement(movement)}
                                  data-testid={`button-delete-${movement.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedMovements.length)} of {sortedMovements.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    
                    {/* Page Numbers with Ellipsis */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages: (number | string)[] = [];
                        const maxVisiblePages = 5;
                        
                        if (totalPages <= maxVisiblePages + 2) {
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          pages.push(1);
                          
                          if (currentPage <= 3) {
                            for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                              pages.push(i);
                            }
                            if (totalPages > 5) {
                              pages.push('...');
                              pages.push(totalPages);
                            }
                          } else if (currentPage >= totalPages - 2) {
                            pages.push('...');
                            for (let i = Math.max(2, totalPages - 4); i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            pages.push('...');
                            pages.push(currentPage - 1);
                            pages.push(currentPage);
                            pages.push(currentPage + 1);
                            pages.push('...');
                            pages.push(totalPages);
                          }
                        }
                        
                        return pages.map((page, idx) => {
                          if (page === '...') {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                                ...
                              </span>
                            );
                          }
                          return (
                            <Button
                              key={page}
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page as number)}
                              className="min-w-[2.5rem]"
                              data-testid={`button-page-${page}`}
                            >
                              {page}
                            </Button>
                          );
                        });
                      })()}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stock Movement Dialog */}
        <StockMovementDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleSubmitMovement}
          defaultValues={
            editingMovement
              ? {
                  productId: editingMovement.productId,
                  date: editingMovement.date,
                  quantity: parseFloat(editingMovement.quantity.toString()),
                  reason: editingMovement.reasonId,
                  remark: editingMovement.remark || "",
                  saleId: editingMovement.saleId,
                  orderId: editingMovement.orderId,
                  roastId: editingMovement.roastId,
                  saleslineId: null,
                }
              : { productId }
          }
          title={editingMovement ? "Edit Stock Movement" : "Add Stock Movement"}
          description={
            editingMovement
              ? "Update the stock movement details below."
              : "Add a new stock movement for this product."
          }
          isSubmitting={createMovementMutation.isPending || updateMovementMutation.isPending}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingMovement} onOpenChange={() => setDeletingMovement(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Stock Movement</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this stock movement? This action cannot be undone.
                {deletingMovement && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>Movement #{deletingMovement.id}</strong>
                    <br />
                    Date: {format(new Date(deletingMovement.date), 'dd/MM/yyyy')}
                    <br />
                    Quantity: {formatNumber(deletingMovement.quantity)} g
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
