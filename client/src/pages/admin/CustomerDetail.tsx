import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, ShoppingCart, Calendar, Euro, User, Mail, Phone, Building, Plus } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { NewSaleDialog } from "@/components/admin/NewSaleDialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import type { Customer } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown } from "lucide-react";

type CustomerStatistics = {
  lifetimeValue: number;
  currentYearRevenue: number;
  previousYearRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
};

type YearlySales = {
  year: number;
  totalRevenue: number;
  orderCount: number;
};

type ProductPurchased = {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
};

export default function CustomerDetail() {
  const params = useParams();
  const customerId = parseInt(params.id || "0");
  const currentYear = new Date().getFullYear();
  const [sortField, setSortField] = useState<"year" | "revenue" | "orders">("year");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [productSortField, setProductSortField] = useState<"name" | "quantity" | "revenue">("revenue");
  const [productSortDirection, setProductSortDirection] = useState<"asc" | "desc">("desc");
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false);

  // Fetch customer details
  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
    enabled: !!customerId,
  });

  // Fetch customer statistics
  const { data: statistics, isLoading: statsLoading } = useQuery<CustomerStatistics>({
    queryKey: [`/api/customers/${customerId}/statistics`],
    enabled: !!customerId,
  });

  // Fetch yearly sales data
  const { data: yearlyData, isLoading: yearlyLoading } = useQuery<YearlySales[]>({
    queryKey: [`/api/customers/${customerId}/yearly-sales`],
    enabled: !!customerId,
  });

  // Fetch products purchased
  const { data: productsPurchased = [], isLoading: productsLoading } = useQuery<ProductPurchased[]>({
    queryKey: [`/api/customers/${customerId}/products-purchased`],
    enabled: !!customerId,
  });

  // Prepare chart data for yearly sales
  const chartData = useMemo(() => {
    if (!yearlyData) return [];
    return [...yearlyData]
      .sort((a, b) => a.year - b.year)
      .map(item => ({
        year: item.year.toString(),
        revenue: item.totalRevenue,
        orders: item.orderCount,
      }));
  }, [yearlyData]);

  // Sort yearly data
  const sortedYearlyData = useMemo(() => {
    if (!yearlyData) return [];

    const sorted = [...yearlyData].sort((a, b) => {
      let aVal: number, bVal: number;

      if (sortField === "year") {
        aVal = a.year;
        bVal = b.year;
      } else if (sortField === "revenue") {
        aVal = a.totalRevenue;
        bVal = b.totalRevenue;
      } else { // orders
        aVal = a.orderCount;
        bVal = b.orderCount;
      }

      const direction = sortDirection === "asc" ? 1 : -1;
      return (aVal - bVal) * direction;
    });

    return sorted;
  }, [yearlyData, sortField, sortDirection]);

  // Sort products purchased
  const sortedProductsData = useMemo(() => {
    if (!productsPurchased) return [];

    const sorted = [...productsPurchased].sort((a, b) => {
      let aVal: number | string, bVal: number | string;

      if (productSortField === "name") {
        aVal = a.productName.toLowerCase();
        bVal = b.productName.toLowerCase();
        const direction = productSortDirection === "asc" ? 1 : -1;
        return aVal < bVal ? -direction : aVal > bVal ? direction : 0;
      } else if (productSortField === "quantity") {
        aVal = a.totalQuantity;
        bVal = b.totalQuantity;
      } else { // revenue
        aVal = a.totalRevenue;
        bVal = b.totalRevenue;
      }

      const direction = productSortDirection === "asc" ? 1 : -1;
      return ((aVal as number) - (bVal as number)) * direction;
    });

    return sorted;
  }, [productsPurchased, productSortField, productSortDirection]);

  const handleSort = (field: "year" | "revenue" | "orders") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleProductSort = (field: "name" | "quantity" | "revenue") => {
    if (productSortField === field) {
      setProductSortDirection(productSortDirection === "asc" ? "desc" : "asc");
    } else {
      setProductSortField(field);
      setProductSortDirection("desc");
    }
  };

  // Calculate year-over-year growth
  const yoyGrowth = useMemo(() => {
    if (!statistics) return 0;
    if (statistics.previousYearRevenue === 0) return 100;
    return ((statistics.currentYearRevenue - statistics.previousYearRevenue) / statistics.previousYearRevenue) * 100;
  }, [statistics]);

  if (customerLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Customer Not Found</h2>
          <p className="text-muted-foreground mt-2">The customer you're looking for doesn't exist.</p>
          <Link href="/admin/customers">
            <Button className="mt-4" data-testid="button-back-to-customers">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
  const customerDisplayName = customer.companyName || customerName;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/customers">
            <Button variant="ghost" size="sm" className="mb-2" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-customer-name">
            {customerDisplayName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={customer.b2bClient ? "default" : "secondary"} data-testid="badge-customer-type">
              {customer.b2bClient ? "B2B Client" : "B2C Client"}
            </Badge>
            {customer.b2bPrices && (
              <Badge variant="outline" data-testid="badge-b2b-prices">
                B2B Pricing Enabled
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowNewSaleDialog(true)} data-testid="button-create-sale">
            <Plus className="w-4 h-4 mr-2" />
            Create Sale
          </Button>
          {customer.email && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="w-4 h-4" />
                <span>{customer.email}</span>
              </div>
            </div>
          )}
          {customer.phone && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Sale Dialog */}
      <NewSaleDialog 
        open={showNewSaleDialog} 
        onOpenChange={setShowNewSaleDialog}
        preSelectedCustomerId={customerId}
      />

      {/* Statistics Cards - AdminLTE Style matching Product page */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(145,60%,50%)] text-white border-0" data-testid="card-lifetime-value">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {statsLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-lifetime-value">
                        {formatCurrency(statistics?.lifetimeValue || 0)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Lifetime Value (excl. VAT)</div>
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

        <div className="col-md-3 mb-3">
          <Card className="bg-[hsl(190,60%,45%)] text-white border-0" data-testid="card-current-year">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {statsLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-current-year-revenue">
                        {formatCurrency(statistics?.currentYearRevenue || 0)}
                      </div>
                      <div className="text-sm font-medium opacity-90">{currentYear} Revenue (excl. VAT)</div>
                      {yoyGrowth !== 0 && (
                        <div className={`text-xs mt-1 ${yoyGrowth > 0 ? 'text-green-200' : 'text-red-200'}`}>
                          {yoyGrowth > 0 ? '↑' : '↓'} {Math.abs(yoyGrowth).toFixed(1)}% vs {currentYear - 1}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <TrendingUp className="w-12 h-12 opacity-30" />
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
          <Card className="bg-[hsl(355,75%,60%)] text-white border-0" data-testid="card-total-orders">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {statsLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-total-orders">
                        {formatNumber(statistics?.totalOrders || 0, 0)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Total Orders</div>
                    </>
                  )}
                </div>
                <ShoppingCart className="w-12 h-12 opacity-30" />
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
          <Card className="bg-[hsl(45,90%,55%)] text-white border-0" data-testid="card-average-order">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {statsLoading ? (
                    <div className="h-12 bg-white/20 rounded animate-pulse w-32"></div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-1" data-testid="text-average-order-value">
                        {formatCurrency(statistics?.averageOrderValue || 0)}
                      </div>
                      <div className="text-sm font-medium opacity-90">Average Order Value</div>
                    </>
                  )}
                </div>
                <Calendar className="w-12 h-12 opacity-30" />
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

      {/* Sales Evolution Chart */}
      <Card data-testid="card-sales-chart">
        <CardHeader>
          <CardTitle>Sales Evolution by Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {yearlyLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No sales data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis
                    yAxisId="left"
                    label={{ value: 'Revenue (€)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => {
                      if (value >= 1000) {
                        return `€${(value / 1000).toFixed(1)}k`;
                      }
                      return `€${value}`;
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Orders', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return formatCurrency(value);
                      return formatNumber(value, 0);
                    }}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    fill="hsl(145, 60%, 50%)"
                    name="Revenue (excl. VAT)"
                    radius={[8, 8, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(355, 75%, 60%)"
                    strokeWidth={3}
                    name="Number of Orders"
                    dot={{ fill: 'hsl(355, 75%, 60%)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Purchased Table */}
      <Card data-testid="card-products-purchased">
        <CardHeader>
          <CardTitle>Products Purchased (Lifetime)</CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleProductSort("name")}
                        className="hover:bg-transparent p-0 h-auto font-semibold"
                        data-testid="button-sort-product-name"
                      >
                        Product Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleProductSort("quantity")}
                        className="hover:bg-transparent p-0 h-auto font-semibold ml-auto flex items-center"
                        data-testid="button-sort-quantity"
                      >
                        Quantity Sold (grams)
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleProductSort("revenue")}
                        className="hover:bg-transparent p-0 h-auto font-semibold ml-auto flex items-center"
                        data-testid="button-sort-product-revenue"
                      >
                        Revenue (excl. VAT)
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProductsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No products purchased yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedProductsData.map((product) => (
                      <TableRow key={product.productId} data-testid={`row-product-${product.productId}`}>
                        <TableCell className="font-medium" data-testid={`text-product-name-${product.productId}`}>
                          {product.productName}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-quantity-${product.productId}`}>
                          {formatNumber(product.totalQuantity)} g
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-product-revenue-${product.productId}`}>
                          {formatCurrency(product.totalRevenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yearly Sales Data Table */}
      <Card data-testid="card-yearly-sales">
        <CardHeader>
          <CardTitle>Yearly Sales Data</CardTitle>
        </CardHeader>
        <CardContent>
          {yearlyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("year")}
                        className="hover:bg-transparent p-0 h-auto font-semibold"
                        data-testid="button-sort-year"
                      >
                        Year
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("revenue")}
                        className="hover:bg-transparent p-0 h-auto font-semibold ml-auto flex items-center"
                        data-testid="button-sort-revenue"
                      >
                        Revenue (excl. VAT)
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("orders")}
                        className="hover:bg-transparent p-0 h-auto font-semibold ml-auto flex items-center"
                        data-testid="button-sort-orders"
                      >
                        Number of Orders
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedYearlyData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No sales data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedYearlyData.map((row) => (
                      <TableRow key={row.year} data-testid={`row-year-${row.year}`}>
                        <TableCell className="font-medium" data-testid={`text-year-${row.year}`}>
                          {row.year}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-revenue-${row.year}`}>
                          {formatCurrency(row.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-orders-${row.year}`}>
                          {formatNumber(row.orderCount, 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Tabs - Detailed Customer Information */}
      <Tabs defaultValue="overview" className="space-y-4" data-testid="tabs-customer-details">
        <TabsList className="!flex w-full">
          <TabsTrigger value="overview" className="flex-1" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="contact" className="flex-1" data-testid="tab-contact">Contact & Address</TabsTrigger>
          <TabsTrigger value="account" className="flex-1" data-testid="tab-account">Account Details</TabsTrigger>
          <TabsTrigger value="pricing" className="flex-1" data-testid="tab-pricing">Custom Pricing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" data-testid="content-overview">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
                  <p className="text-lg font-semibold" data-testid="text-overview-id">{customer.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-lg font-semibold" data-testid="text-overview-name">{customerName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="text-lg font-semibold" data-testid="text-overview-company">{customer.companyName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">VAT Number</p>
                  <p className="text-lg font-semibold" data-testid="text-overview-vat">{customer.vatNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Type</p>
                  <p className="text-lg font-semibold" data-testid="text-overview-type">
                    {customer.b2bClient ? "B2B (Business)" : "B2C (Consumer)"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pricing Model</p>
                  <p className="text-lg font-semibold" data-testid="text-overview-pricing">
                    {customer.b2bPrices ? "B2B Prices" : "B2C Prices"}
                  </p>
                </div>
                {statistics?.firstPurchaseDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">First Purchase</p>
                    <p className="text-lg font-semibold" data-testid="text-overview-first-purchase">
                      {format(new Date(statistics.firstPurchaseDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
                {statistics?.lastPurchaseDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Purchase</p>
                    <p className="text-lg font-semibold" data-testid="text-overview-last-purchase">
                      {format(new Date(statistics.lastPurchaseDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
                {customer.birthday && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Birthday</p>
                    <p className="text-lg font-semibold" data-testid="text-overview-birthday">
                      {format(new Date(customer.birthday), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
                {customer.woocommerceId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">WooCommerce ID</p>
                    <p className="text-lg font-semibold" data-testid="text-overview-woo-id">
                      {customer.woocommerceId}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact & Address Tab */}
        <TabsContent value="contact" data-testid="content-contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact & Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg font-semibold" data-testid="text-contact-email">{customer.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-lg font-semibold" data-testid="text-contact-phone">{customer.phone || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Street</p>
                    <p className="text-lg font-semibold" data-testid="text-billing-street">
                      {customer.billingAddressStreet || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bus</p>
                    <p className="text-lg font-semibold" data-testid="text-billing-bus">
                      {customer.billingAddressBus || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Postal Code</p>
                    <p className="text-lg font-semibold" data-testid="text-billing-postal">
                      {customer.billingAddressPostalCode || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">City</p>
                    <p className="text-lg font-semibold" data-testid="text-billing-city">
                      {customer.billingAddressCity || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Street</p>
                    <p className="text-lg font-semibold" data-testid="text-shipping-street">
                      {customer.shippingAddressStreet || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bus</p>
                    <p className="text-lg font-semibold" data-testid="text-shipping-bus">
                      {customer.shippingAddressBus || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Postal Code</p>
                    <p className="text-lg font-semibold" data-testid="text-shipping-postal">
                      {customer.shippingAddressPostalCode || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">City</p>
                    <p className="text-lg font-semibold" data-testid="text-shipping-city">
                      {customer.shippingAddressCity || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Details Tab */}
        <TabsContent value="account" data-testid="content-account">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                  <p className="text-lg font-semibold" data-testid="text-account-created">
                    {format(new Date(customer.creationDate), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Modified</p>
                  <p className="text-lg font-semibold" data-testid="text-account-modified">
                    {format(new Date(customer.modificationDate), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Lifetime Orders</p>
                  <p className="text-lg font-semibold" data-testid="text-account-total-orders">
                    {formatNumber(statistics?.totalOrders || 0, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Lifetime Revenue</p>
                  <p className="text-lg font-semibold" data-testid="text-account-total-revenue">
                    {formatCurrency(statistics?.lifetimeValue || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
                  <p className="text-lg font-semibold" data-testid="text-account-avg-order">
                    {formatCurrency(statistics?.averageOrderValue || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Status</p>
                  <p className="text-lg font-semibold">
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Pricing Tab */}
        <TabsContent value="pricing" data-testid="content-pricing">
          <Card>
            <CardHeader>
              <CardTitle>Customer-Specific Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Custom pricing management coming soon...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This feature will allow you to set customer-specific prices that override standard B2B/B2C pricing.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
