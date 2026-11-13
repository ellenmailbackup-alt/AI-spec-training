import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Send, CheckCircle, Euro, FileBarChart, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { SendInvoiceDialog } from "@/components/admin/SendInvoiceDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SaleWithLines, Customer } from "@shared/schema";

const INVOICED_STATUS_ID = 3;
const PAID_STATUS_ID = 4;

export default function AdminInvoices() {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("invoiced");
  const [sendInvoiceDialogOpen, setSendInvoiceDialogOpen] = useState(false);
  const [selectedSaleForEmail, setSelectedSaleForEmail] = useState<any | null>(null);
  const [mutatingPaidId, setMutatingPaidId] = useState<number | null>(null);

  // Fetch all sales (API returns Sale with customerName field)
  const { data: allSales = [], isLoading: isLoadingSales } = useQuery<any[]>({
    queryKey: ["/api/sales"],
  });

  // Fetch all customers for filter dropdown
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Calculate total for a sale
  const calculateSaleTotal = (sale: any): number => {
    // Use pre-calculated totals from the API
    const saleslinesTotal = parseFloat(sale.saleslinesTotal || "0");
    const shippingCost = parseFloat(sale.shippingCostWithVat || "0");
    const discount = parseFloat(sale.discountWithVat || "0");

    return saleslinesTotal + shippingCost - discount;
  };

  // Filter sales to only INVOICED and PAID statuses with valid invoice numbers
  const invoiceSales = useMemo(() => {
    return allSales.filter(sale => 
      (sale.salesStatus === INVOICED_STATUS_ID || sale.salesStatus === PAID_STATUS_ID) &&
      sale.invoiceNumber && sale.invoiceNumber !== "0"
    );
  }, [allSales]);

  // Apply filters
  const filteredSales = useMemo(() => {
    return invoiceSales.filter(sale => {
      // Date filter
      if (dateFrom) {
        const saleDate = new Date(sale.salesDate);
        const fromDate = new Date(dateFrom);
        if (saleDate < fromDate) return false;
      }
      if (dateTo) {
        const saleDate = new Date(sale.salesDate);
        const toDate = new Date(dateTo);
        if (saleDate > toDate) return false;
      }

      // Customer filter
      if (selectedCustomerId !== "all" && sale.customerId !== parseInt(selectedCustomerId)) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all") {
        if (selectedStatus === "invoiced" && sale.salesStatus !== INVOICED_STATUS_ID) {
          return false;
        }
        if (selectedStatus === "paid" && sale.salesStatus !== PAID_STATUS_ID) {
          return false;
        }
      }

      return true;
    });
  }, [invoiceSales, dateFrom, dateTo, selectedCustomerId, selectedStatus]);

  // Calculate summary statistics
  const statistics = useMemo(() => {
    const invoiced = filteredSales.filter(s => s.salesStatus === INVOICED_STATUS_ID);
    const paid = filteredSales.filter(s => s.salesStatus === PAID_STATUS_ID);

    const totalInvoiced = invoiced.reduce((sum, sale) => sum + calculateSaleTotal(sale), 0);
    const totalPaid = paid.reduce((sum, sale) => sum + calculateSaleTotal(sale), 0);
    const outstanding = totalInvoiced;

    return {
      totalInvoiced,
      totalPaid,
      outstanding,
      numberOfInvoices: filteredSales.length,
    };
  }, [filteredSales]);

  // Mark as Paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (saleId: number) => {
      setMutatingPaidId(saleId);
      return await apiRequest('PATCH', `/api/sales/${saleId}/status`, {
        statusId: PAID_STATUS_ID,
        createStockMovements: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Success",
        description: "Invoice marked as paid",
      });
      setMutatingPaidId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice status",
        variant: "destructive",
      });
      setMutatingPaidId(null);
    },
  });

  // Send Invoice mutation
  const sendInvoiceMutation = useMutation({
    mutationFn: async ({ saleId, subject, body }: { saleId: number; subject: string; body: string }) => {
      return await apiRequest('POST', `/api/sales/${saleId}/send-invoice`, {
        subject,
        body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Invoice Sent",
        description: "Invoice has been sent successfully",
      });
      setSendInvoiceDialogOpen(false);
      setSelectedSaleForEmail(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invoice",
        variant: "destructive",
      });
    },
  });

  const handleDownloadInvoice = async (sale: any) => {
    if (!sale.invoiceNumber) {
      toast({
        title: "Error",
        description: "This sale does not have an invoice number",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/sales/${sale.id}/invoice-pdf`);
      if (!response.ok) throw new Error('Failed to download invoice');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factuur_${new Date(sale.salesDate).getFullYear()}_${sale.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const handleResendEmail = (sale: any) => {
    setSelectedSaleForEmail(sale);
    setSendInvoiceDialogOpen(true);
  };

  const handleSendInvoice = (subject: string, body: string) => {
    if (selectedSaleForEmail) {
      sendInvoiceMutation.mutate({
        saleId: selectedSaleForEmail.id,
        subject,
        body,
      });
    }
  };

  const getCustomerName = (sale: any): string => {
    // API returns customerName directly from backend
    if (sale.customerName) {
      return sale.customerName;
    }
    
    // Fallback to customer object if available (for SaleWithLines)
    if (sale.customer) {
      // Prefer company name for B2B customers, otherwise use contact name
      if (sale.customer.companyName) {
        return sale.customer.companyName;
      }
      return `${sale.customer.firstName} ${sale.customer.lastName}`.trim();
    }
    return "Unknown Customer";
  };

  const getCustomerEmail = (sale: any): string => {
    // If we have the customer object, use it
    if (sale.customer?.email) {
      return sale.customer.email;
    }
    // Otherwise we need to fetch it separately - for now return empty
    // The SendInvoiceDialog will handle fetching customer details
    return "";
  };

  const isLoading = isLoadingSales || isLoadingCustomers;

  return (
    <AdminLayout>
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="font-serif text-3xl font-semibold mb-2">Invoices</h1>
          <p className="text-muted-foreground">Manage invoices and track payment status</p>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(190,60%,45%)] text-white border-0" data-testid="card-total-invoiced">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {isLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold mb-1" data-testid="text-total-invoiced">
                        {formatCurrency(statistics.totalInvoiced, false)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Total Invoiced</div>
                    </>
                  )}
                </div>
                <FileText className="w-12 h-12 opacity-30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(145,60%,50%)] text-white border-0" data-testid="card-total-paid">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {isLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold mb-1" data-testid="text-total-paid">
                        {formatCurrency(statistics.totalPaid, false)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Total Paid</div>
                    </>
                  )}
                </div>
                <Euro className="w-12 h-12 opacity-30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(45,90%,55%)] text-white border-0" data-testid="card-outstanding">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {isLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold mb-1" data-testid="text-outstanding">
                        {formatCurrency(statistics.outstanding, false)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Outstanding</div>
                    </>
                  )}
                </div>
                <AlertCircle className="w-12 h-12 opacity-30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(355,75%,60%)] text-white border-0" data-testid="card-number-invoices">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {isLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-number-invoices">
                        {statistics.numberOfInvoices}
                      </div>
                      <div className="text-sm font-medium opacity-90">Number of Invoices</div>
                    </>
                  )}
                </div>
                <FileBarChart className="w-12 h-12 opacity-30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-12">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-from">Date From</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    data-testid="input-date-from"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-to">Date To</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    data-testid="input-date-to"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-filter">Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger id="customer-filter" data-testid="select-customer">
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.companyName || `${customer.firstName} ${customer.lastName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger id="status-filter" data-testid="select-status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="invoiced">INVOICED</SelectItem>
                      <SelectItem value="paid">PAID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="row">
        <div className="col-12">
          <Card>
            <CardHeader>
              <CardTitle>Invoice List</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse text-muted-foreground">Loading invoices...</div>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No invoices found</p>
                  <p className="text-sm text-muted-foreground">
                    {invoiceSales.length === 0 
                      ? "There are no invoices in the system yet"
                      : "Try adjusting your filters to see more results"
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id} data-testid={`row-invoice-${sale.id}`}>
                          <TableCell className="font-mono" data-testid={`text-invoice-number-${sale.id}`}>
                            {sale.invoiceNumber || "N/A"}
                          </TableCell>
                          <TableCell data-testid={`text-date-${sale.id}`}>
                            {format(new Date(sale.salesDate), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell data-testid={`text-customer-${sale.id}`}>
                            {getCustomerName(sale)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={sale.salesStatus === PAID_STATUS_ID ? "default" : "outline"}
                              data-testid={`badge-status-${sale.id}`}
                            >
                              {sale.salesStatus === INVOICED_STATUS_ID ? "INVOICED" : "PAID"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium" data-testid={`text-total-${sale.id}`}>
                            {formatCurrency(calculateSaleTotal(sale))}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadInvoice(sale)}
                                data-testid={`button-download-${sale.id}`}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResendEmail(sale)}
                                disabled={!getCustomerEmail(sale)}
                                data-testid={`button-resend-${sale.id}`}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Resend
                              </Button>
                              {sale.salesStatus === INVOICED_STATUS_ID && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => markAsPaidMutation.mutate(sale.id)}
                                  disabled={mutatingPaidId === sale.id}
                                  data-testid={`button-mark-paid-${sale.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Mark as Paid
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Send Invoice Dialog */}
      {selectedSaleForEmail && (
        <SendInvoiceDialog
          open={sendInvoiceDialogOpen}
          onOpenChange={setSendInvoiceDialogOpen}
          invoiceNumber={selectedSaleForEmail.invoiceNumber || ""}
          customerEmail={getCustomerEmail(selectedSaleForEmail)}
          onSend={handleSendInvoice}
          isSending={sendInvoiceMutation.isPending}
        />
      )}
    </AdminLayout>
  );
}
