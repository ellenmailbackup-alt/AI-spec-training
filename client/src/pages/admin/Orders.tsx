import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ArrowUpDown, Check, X, FileText, Globe, Store, Euro, Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/currency";
import { NewSaleDialog } from "@/components/admin/NewSaleDialog";
import { EditSaleDialog } from "@/components/admin/EditSaleDialog";
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

type SaleWithDetails = {
  id: number;
  invoiceNumber: string | null;
  customerId: number;
  customerName: string;
  contactName?: string | null;
  salesDate: Date;
  paymentMethod: number;
  paymentMethodName: string;
  salesStatus: number;
  salesStatusName: string;
  webshopSale: boolean;
  stockUpdated: boolean;
  uploadedAccounting: boolean;
};

type SalesStats = {
  totalInvoices: number;
  revenueWebshop: string;
  revenueKruze: string;
  revenueBoeren: string;
};

type SortField = "invoiceNumber" | "customerName" | "salesDate" | "paymentMethodName" | "salesStatusName";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const PAID_STATUS_ID = 4; // Status ID for "paid" sales

export default function AdminOrders() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [sortField, setSortField] = useState<SortField>("salesDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false);
  const [editSaleId, setEditSaleId] = useState<number | null>(null);
  const [deleteSaleId, setDeleteSaleId] = useState<number | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: sales, isLoading } = useQuery<SaleWithDetails[]>({
    queryKey: ["/api/sales"],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<SalesStats>({
    queryKey: ["/api/sales/stats", selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/sales/stats/${selectedYear}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  // Generate year options (from 2015 to current year + 1)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = 2015; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years.reverse(); // Most recent first
  }, [currentYear]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter sales by selected year and search term
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter((sale) => {
      const saleYear = new Date(sale.salesDate).getFullYear();
      const matchesYear = saleYear === selectedYear;

      if (!searchTerm) return matchesYear;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        sale.invoiceNumber?.toLowerCase().includes(searchLower) ||
        sale.customerName.toLowerCase().includes(searchLower) ||
        (sale.contactName?.toLowerCase().includes(searchLower) ?? false) ||
        sale.id.toString().includes(searchLower) ||
        sale.paymentMethodName.toLowerCase().includes(searchLower) ||
        sale.salesStatusName.toLowerCase().includes(searchLower);

      return matchesYear && matchesSearch;
    });
  }, [sales, selectedYear, searchTerm]);

  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date sorting
      if (sortField === "salesDate") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      // Handle invoice number sorting (numeric)
      else if (sortField === "invoiceNumber") {
        // Extract numeric part from invoice number for proper numeric sorting
        const extractNumber = (invoice: string | null) => {
          if (!invoice) return 0;
          const match = invoice.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        };
        aValue = extractNumber(aValue);
        bValue = extractNumber(bValue);
      }
      // Handle string sorting (case-insensitive)
      else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredSales, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = sortedSales.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedYear, searchTerm]);

  // Delete mutation
  const deleteSaleMutation = useMutation({
    mutationFn: async (saleId: number) => {
      return apiRequest("delete", `/api/sales/${saleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/stats", selectedYear] });
      toast({
        title: "Success",
        description: "Sale deleted successfully",
      });
      setDeleteSaleId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sale",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (deleteSaleId) {
      deleteSaleMutation.mutate(deleteSaleId);
    }
  };

  return (
    <AdminLayout>
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="font-serif text-3xl font-semibold mb-2">Sales</h1>
          <p className="text-muted-foreground">Track sales from all channels (online store, POS, and manual orders)</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(190,60%,45%)] text-white border-0" data-testid="card-total-invoices">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {isLoadingStats ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-total-invoices">
                        {stats?.totalInvoices || 0}
                      </div>
                      <div className="text-sm font-medium opacity-90"># Invoices</div>
                    </>
                  )}
                </div>
                <FileText className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(45,90%,55%)] text-white border-0" data-testid="card-revenue-webshop">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {isLoadingStats ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-revenue-webshop">
                        {formatCurrency(stats?.revenueWebshop, false)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Revenue Webshop</div>
                    </>
                  )}
                </div>
                <Globe className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(355,75%,60%)] text-white border-0" data-testid="card-revenue-kruze">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {isLoadingStats ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-revenue-kruze">
                        {formatCurrency(stats?.revenueKruze, false)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Revenue Kruze</div>
                    </>
                  )}
                </div>
                <Store className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(145,60%,50%)] text-white border-0" data-testid="card-revenue-boeren">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {isLoadingStats ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-revenue-boeren">
                        {formatCurrency(stats?.revenueBoeren, false)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Revenue Boeren</div>
                    </>
                  )}
                </div>
                <Euro className="w-12 h-12 opacity-30" />
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal">
                  More info <span className="ml-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Sales Management</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="year-select" className="text-sm text-muted-foreground whitespace-nowrap">
                      Year:
                    </label>
                    <select
                      id="year-select"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="form-select form-select-sm"
                      style={{ width: "120px" }}
                      data-testid="select-year"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={() => setShowNewSaleDialog(true)}
                    data-testid="button-new-sale"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Sale
                  </Button>
                </div>
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
                    className="form-select form-select-sm"
                    style={{ width: "80px" }}
                    data-testid="select-items-per-page"
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
                  <label htmlFor="search" className="text-sm text-muted-foreground">Search:</label>
                  <input
                    id="search"
                    type="text"
                    placeholder="Search sales..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control form-control-sm"
                    style={{ width: "250px" }}
                    data-testid="input-search"
                  />
                </div>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading sales...</p>
                  </div>
                </div>
              ) : !filteredSales || filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">{searchTerm ? `No sales found for "${searchTerm}"` : `No sales for ${selectedYear}`}</p>
                  <p className="text-sm text-muted-foreground">{searchTerm ? "Try a different search term" : "Try selecting a different year"}</p>
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
                              onClick={() => handleSort("invoiceNumber")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="button-sort-invoice"
                            >
                              Invoice #
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("customerName")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="button-sort-customer"
                            >
                              Customer
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("salesDate")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="button-sort-date"
                            >
                              Date
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("paymentMethodName")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="button-sort-payment"
                            >
                              Payment
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("salesStatusName")}
                              className="hover:bg-transparent p-0 h-auto font-semibold"
                              data-testid="button-sort-status"
                            >
                              Status
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                              >
                                Webshop
                              </Button>
                            </div>
                          </th>
                          <th>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                              >
                                Stock Updated
                              </Button>
                            </div>
                          </th>
                          <th>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                              >
                                Uploaded Accounting
                              </Button>
                            </div>
                          </th>
                          <th>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                className="hover:bg-transparent p-0 h-auto font-semibold pointer-events-none"
                              >
                                Actions
                              </Button>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSales.map((sale) => (
                          <tr
                            key={sale.id}
                            data-testid={`row-sale-${sale.id}`}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setLocation(`/admin/orders/${sale.id}`)}
                          >
                            <td className="font-mono font-medium" data-testid={`text-invoice-${sale.id}`}>
                              {sale.invoiceNumber || `#${sale.id}`}
                            </td>
                            <td data-testid={`text-customer-${sale.id}`}>
                              {sale.customerName}
                            </td>
                            <td className="text-muted-foreground text-sm" data-testid={`text-date-${sale.id}`}>
                              {sale.salesDate ? format(new Date(sale.salesDate), 'dd/MM/yyyy') : '-'}
                            </td>
                            <td>
                              <Badge variant="outline" data-testid={`badge-payment-${sale.id}`}>
                                {sale.paymentMethodName}
                              </Badge>
                            </td>
                            <td>
                              <Badge variant="outline" data-testid={`badge-status-${sale.id}`}>
                                {sale.salesStatusName}
                              </Badge>
                            </td>
                            <td className="text-center align-middle" data-testid={`text-webshop-${sale.id}`}>
                              {sale.webshopSale ? (
                                <Check className="w-4 h-4 text-green-600 inline-block" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground opacity-30 inline-block" />
                              )}
                            </td>
                            <td className="text-center align-middle" data-testid={`text-stock-${sale.id}`}>
                              {sale.stockUpdated ? (
                                <Check className="w-4 h-4 text-green-600 inline-block" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground opacity-30 inline-block" />
                              )}
                            </td>
                            <td className="text-center align-middle" data-testid={`text-accounting-${sale.id}`}>
                              {sale.uploadedAccounting ? (
                                <Check className="w-4 h-4 text-green-600 inline-block" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground opacity-30 inline-block" />
                              )}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                  onClick={() => setEditSaleId(sale.id)}
                                  disabled={sale.salesStatus === PAID_STATUS_ID}
                                  data-testid={`button-edit-${sale.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeleteSaleId(sale.id)}
                                  disabled={sale.salesStatus === PAID_STATUS_ID}
                                  data-testid={`button-delete-${sale.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, sortedSales.length)} of {sortedSales.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        data-testid="button-previous-page"
                      >
                        Previous
                      </Button>
                      
                      {/* Page Numbers with Ellipsis */}
                      <div className="flex items-center gap-1">
                        {(() => {
                          const pages: (number | string)[] = [];
                          const maxVisiblePages = 5;
                          
                          if (totalPages <= maxVisiblePages + 2) {
                            // Show all pages if total is small
                            for (let i = 1; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // Always show first page
                            pages.push(1);
                            
                            if (currentPage <= 3) {
                              // Near start: show 1,2,3,4,5,...,last
                              for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                                pages.push(i);
                              }
                              if (totalPages > 5) {
                                pages.push('...');
                                pages.push(totalPages);
                              }
                            } else if (currentPage >= totalPages - 2) {
                              // Near end: show 1,...,last-4,last-3,last-2,last-1,last
                              pages.push('...');
                              for (let i = Math.max(2, totalPages - 4); i <= totalPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              // Middle: show 1,...,current-1,current,current+1,...,last
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
                        onClick={() => setCurrentPage(currentPage + 1)}
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
        </div>
      </div>

      <NewSaleDialog open={showNewSaleDialog} onOpenChange={setShowNewSaleDialog} />

      {editSaleId && (
        <EditSaleDialog
          open={editSaleId !== null}
          onOpenChange={(open) => !open && setEditSaleId(null)}
          saleId={editSaleId}
        />
      )}

      <AlertDialog open={deleteSaleId !== null} onOpenChange={(open) => !open && setDeleteSaleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sale? This action cannot be undone and will permanently remove the sale and all its line items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
