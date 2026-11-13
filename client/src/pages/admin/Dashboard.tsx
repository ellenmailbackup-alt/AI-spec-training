import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Minus, AlertTriangle, TrendingUp, Users, Package, BarChart3, Box } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/currency";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

interface RevenueChange {
  absolute: number;
  percentage: number | null;
  trend: "up" | "down" | "flat";
}

interface DashboardData {
  revenueOverview: {
    currentMonth: {
      amount: number;
      year: number;
      month: number;
      label: string;
    };
    previousYearMonth: {
      amount: number;
      year: number;
      month: number;
      label: string;
    };
    currentMonthChange: RevenueChange;
    ytdCurrent: {
      amount: number;
      year: number;
    };
    ytdPrevious: {
      amount: number;
      year: number;
    };
    ytdChange: RevenueChange;
  };
  revenueByChannel: Array<{
    channel: string;
    currentMonth: number;
    previousMonth: number;
    change: RevenueChange;
  }>;
  monthlySalesTrend: Array<{
    month: string;
    monthNumber: number;
    currentYear: number;
    previousYear: number;
  }>;
  salesByCategory: Array<{
    categoryId: number;
    categoryName: string;
    revenue: number;
  }>;
  invoiceHealth: {
    outstandingAmount: number;
    outstandingCount: number;
    overdueAmount: number;
    overdueCount: number;
    avgDaysToPayment: number;
    targetDays: number;
  };
  stockAlerts: Array<{
    productId: number;
    productName: string;
    currentStock: number;
    avgMonthlySales: number;
    daysRemaining: number;
    unit: string;
  }>;
  customerStats: {
    totalCustomers: number;
    newThisMonth: number;
    oneTimeCustomers: number;
    inactiveCustomers: number;
    totalSales: number;
  };
  topCustomers: Array<{
    customerId: number;
    customerName: string;
    revenue: number;
  }>;
  topProducts: Array<{
    productId: number;
    productName: string;
    revenue: number;
    quantitySold: number;
  }>;
}

interface SalesAnalysisData {
  monthlyComparison: Array<any>;
  lifetimeStats: {
    totalRevenue: number;
    bestMonth: {
      month: number;
      year: number;
      revenue: number;
      label: string;
    };
  };
  yearOverYearGrowth: Array<{
    year: number;
    revenue: number;
    growth: number | null;
    isYTD: boolean;
  }>;
  channelPerformance: Array<any>;
  years: number[];
}

interface InventoryData {
  stockMovementSummary: Array<{
    categoryId: number;
    categoryName: string;
    stockIn: number;
    stockOut: number;
    netChange: number;
  }>;
  inventoryLevels: Array<{
    productId: number;
    productName: string;
    currentStock: number;
    avgMonthlySales: number;
    daysRemaining: number;
    unit: string;
  }>;
  recentMovements: Array<any>;
}

// Helper function to format stock values with proper unit display
const formatStockValue = (value: number, unit: string): string => {
  // For piece items (stuk), show as integer without unit suffix
  if (unit === 'stuk') {
    return formatNumber(value, 0);
  }
  // For weight-based items, show in grams (stock is stored in grams)
  return formatNumber(value, 0) + ' g';
};

// Helper function to format monthly sales values with proper unit display
const formatMonthlySales = (value: number, unit: string): string => {
  // For piece items (stuk), show as integer
  if (unit === 'stuk') {
    return formatNumber(value, 0) + '/mo';
  }
  // For weight-based items, show in grams
  return formatNumber(value, 0) + ' g/mo';
};

// Helper to format sold quantity from grams to a readable unit
const formatSoldQuantity = (quantityInGrams: number): string => {
  if (quantityInGrams >= 1000) {
    return `${formatNumber(quantityInGrams / 1000, 1)} kg`;
  }

  return `${formatNumber(quantityInGrams, 0)} g`;
};

// Coffee & Tea themed chart colors
const CHART_COLORS = ["#5D4037", "#2E7D32", "#D4A574", "#8D6E63", "#66BB6A", "#BCAAA4"];

// Helper to format month abbreviation (e.g., "Dec 2025")
const formatMonthYear = (month: number, year: number): string => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[month - 1]} ${year}`;
};

export default function AdminDashboard() {
  const [selectedYears, setSelectedYears] = useState<number[]>([2022, 2023, 2024, 2025]);

  const now = new Date();
  const [selectedYear,  setSelectedYear]  = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/analytics/dashboard", selectedYear, selectedMonth],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/dashboard?year=${selectedYear}&month=${selectedMonth}`
      );
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      return response.json();
    },
  });

  const { data: salesAnalysis, isLoading: salesLoading } = useQuery<SalesAnalysisData>({
    queryKey: ["/api/analytics/sales-analysis", selectedYears.join(',')],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/sales-analysis?years=${selectedYears.join(',')}`);
      if (!response.ok) throw new Error('Failed to fetch sales analysis');
      return response.json();
    },
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryData>({
    queryKey: ["/api/analytics/inventory"],
  });

  const fallbackOverview = {
    currentMonth: { amount: 0, year: new Date().getFullYear(), month: new Date().getMonth() + 1, label: "Current month" },
    previousYearMonth: { amount: 0, year: new Date().getFullYear() - 1, month: new Date().getMonth() + 1, label: "Last year" },
    currentMonthChange: { absolute: 0, percentage: 0, trend: "flat" as const },
    ytdCurrent: { amount: 0, year: new Date().getFullYear() },
    ytdPrevious: { amount: 0, year: new Date().getFullYear() - 1 },
    ytdChange: { absolute: 0, percentage: 0, trend: "flat" as const },
  };
  const revenueOverview = data?.revenueOverview ?? fallbackOverview;

  const formatSignedCurrency = (value: number) => {
    if (value === 0) {
      return formatCurrency(0);
    }
    const sign = value > 0 ? "+" : "-";
    return `${sign}${formatCurrency(Math.abs(value))}`;
  };

  const formatSignedPercentage = (value: number | null) => {
    if (value === null) {
      return "N/A";
    }
    if (value === 0) {
      return "0%";
    }
    const sign = value > 0 ? "+" : "-";
    return `${sign}${formatPercentage(Math.abs(value), 1)}`;
  };

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "flat" }) => {
    if (trend === "up") {
      return <ArrowUpRight className="h-4 w-4 text-white" />;
    }
    if (trend === "down") {
      return <ArrowDownRight className="h-4 w-4 text-white" />;
    }
    return <Minus className="h-4 w-4 text-white" />;
  };

  const channelLabels: Record<string, string> = {
    B2B: "B2B",
    B2C: "B2C",
    WEBSHOP: "Webshop",
    BOEREN_EN_BUREN: "Boeren & Buren",
  };

  // Calculate urgent alerts count
  const urgentAlertsCount = (data?.invoiceHealth?.overdueCount || 0) +
    (data?.stockAlerts?.filter(a => a.daysRemaining < 30).length || 0);

  const toggleYear = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year].sort()
    );
  };

  return (
    <AdminLayout>
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="font-serif text-3xl font-semibold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Analytics & Insights (VAT excl)</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sales-analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Sales Analysis
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          {/* Month navigation */}
          <div className="flex items-center gap-3 mb-4">
            <Button variant="outline" size="sm" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-28 text-center">
              {formatMonthYear(selectedMonth, selectedYear)}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextMonth} disabled={isCurrentMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isCurrentMonth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedYear(now.getFullYear());
                  setSelectedMonth(now.getMonth() + 1);
                }}
              >
                Back to current
              </Button>
            )}
          </div>

          {/* Summary KPI Cards - Matching Sales page colors */}
          <div className="row mb-4" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <div className="col-md-3 col-sm-6 mb-3" style={{ display: 'flex' }}>
              <Card className="border-0 w-full bg-[hsl(190,60%,45%)] text-white" style={{ minHeight: '120px' }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80">
                        {isCurrentMonth ? "This Month" : formatMonthYear(selectedMonth, selectedYear)}
                      </p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(revenueOverview.currentMonth.amount)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendIcon trend={revenueOverview.currentMonthChange.trend} />
                        <span className="text-xs text-white/80">
                          {formatSignedPercentage(revenueOverview.currentMonthChange.percentage)}
                        </span>
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-white/50" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-md-3 col-sm-6 mb-3" style={{ display: 'flex' }}>
              <Card className="border-0 w-full bg-[hsl(45,90%,55%)] text-white" style={{ minHeight: '120px' }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80">YTD {revenueOverview.ytdCurrent.year}</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(revenueOverview.ytdCurrent.amount)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendIcon trend={revenueOverview.ytdChange.trend} />
                        <span className="text-xs text-white/80">
                          {formatSignedPercentage(revenueOverview.ytdChange.percentage)}
                        </span>
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-white/50" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-md-3 col-sm-6 mb-3" style={{ display: 'flex' }}>
              <Card className="border-0 w-full bg-[hsl(355,75%,60%)] text-white" style={{ minHeight: '120px' }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80">Top Customer</p>
                      {data?.topCustomers && data.topCustomers.length > 0 ? (
                        <>
                          <p className="text-lg font-semibold truncate text-white" title={data.topCustomers[0].customerName}>
                            {data.topCustomers[0].customerName.length > 15
                              ? data.topCustomers[0].customerName.substring(0, 15) + '...'
                              : data.topCustomers[0].customerName}
                          </p>
                          <p className="text-xs text-white/80">{formatCurrency(data.topCustomers[0].revenue)}</p>
                        </>
                      ) : (
                        <p className="text-sm text-white/80">No data</p>
                      )}
                    </div>
                    <Users className="h-8 w-8 text-white/50" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-md-3 col-sm-6 mb-3" style={{ display: 'flex' }}>
              <Card className="border-0 w-full bg-[hsl(145,60%,50%)] text-white" style={{ minHeight: '120px' }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80">Top Product</p>
                      {data?.topProducts && data.topProducts.length > 0 ? (
                        <>
                          <p className="text-lg font-semibold truncate text-white" title={data.topProducts[0].productName}>
                            {data.topProducts[0].productName.length > 15
                              ? data.topProducts[0].productName.substring(0, 15) + '...'
                              : data.topProducts[0].productName}
                          </p>
                          <p className="text-xs text-white/80">{formatCurrency(data.topProducts[0].revenue)}</p>
                        </>
                      ) : (
                        <p className="text-sm text-white/80">No data</p>
                      )}
                    </div>
                    <Package className="h-8 w-8 text-white/50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {urgentAlertsCount > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">
                    {urgentAlertsCount} urgent alert{urgentAlertsCount !== 1 ? 's' : ''}:
                    {data?.invoiceHealth?.overdueCount ? ` ${data.invoiceHealth.overdueCount} overdue invoice${data.invoiceHealth.overdueCount !== 1 ? 's' : ''}` : ''}
                    {data?.invoiceHealth?.overdueCount && data?.stockAlerts?.filter(a => a.daysRemaining < 30).length ? ', ' : ''}
                    {data?.stockAlerts?.filter(a => a.daysRemaining < 30).length ? ` ${data.stockAlerts.filter(a => a.daysRemaining < 30).length} critical stock alert${data.stockAlerts.filter(a => a.daysRemaining < 30).length !== 1 ? 's' : ''}` : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Revenue by Channel */}
          <div className="row mb-4">
            <div className="col-12">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Channel</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-32 bg-muted/30 rounded animate-pulse"></div>
                  ) : error || !data?.revenueByChannel ? (
                    <div className="text-muted-foreground">No channel data available.</div>
                  ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">Channel</th>
                              <th className="text-right py-2 px-4">
                                {formatMonthYear(revenueOverview.currentMonth.month, revenueOverview.currentMonth.year)}
                              </th>
                              <th className="text-right py-2 px-4">
                                {formatMonthYear(revenueOverview.previousYearMonth.month, revenueOverview.previousYearMonth.year)}
                              </th>
                              <th className="text-right py-2 px-4">Change</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.revenueByChannel.map((channel) => (
                              <tr key={channel.channel} className="border-b">
                                <td className="py-2 px-4">{channelLabels[channel.channel] || channel.channel}</td>
                                <td className="text-right py-2 px-4">{formatCurrency(channel.currentMonth)}</td>
                                <td className="text-right py-2 px-4">{formatCurrency(channel.previousMonth)}</td>
                                <td className="text-right py-2 px-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <TrendIcon trend={channel.change.trend} />
                                    <span className="text-sm">
                                      {formatSignedCurrency(channel.change.absolute)} (
                                      {formatSignedPercentage(channel.change.percentage)})
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Monthly Sales Trend & Category Breakdown */}
          <div className="row mb-4">
            <div className="col-lg-8">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 bg-muted/30 rounded animate-pulse"></div>
                  ) : error || !data?.monthlySalesTrend ? (
                    <div className="text-muted-foreground">No trend data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.monthlySalesTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="currentYear"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          name={`${new Date().getFullYear()}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="previousYear"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name={`${new Date().getFullYear() - 1}`}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="col-lg-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Category (YTD)</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 bg-muted/30 rounded animate-pulse"></div>
                  ) : error || !data?.salesByCategory || data.salesByCategory.length === 0 ? (
                    <div className="text-muted-foreground">No category data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data.salesByCategory}
                          dataKey="revenue"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.categoryName}: ${formatCurrency(entry.revenue)}`}
                        >
                          {data.salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Invoice Health & Stock Alerts */}
          <div className="row mb-4">
            <div className="col-lg-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Health</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-32 bg-muted/30 rounded animate-pulse"></div>
                  ) : error || !data?.invoiceHealth ? (
                    <div className="text-muted-foreground">No invoice data available.</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Outstanding Invoices</span>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(data.invoiceHealth.outstandingAmount)}</p>
                          <p className="text-xs text-muted-foreground">{data.invoiceHealth.outstandingCount} invoices</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          Overdue ({'>'}{data.invoiceHealth.targetDays} days)
                          {data.invoiceHealth.overdueCount > 0 && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </span>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(data.invoiceHealth.overdueAmount)}</p>
                          <p className="text-xs text-muted-foreground">{data.invoiceHealth.overdueCount} invoices</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Avg. Days to Payment</span>
                        <p className="font-semibold">{Math.round(data.invoiceHealth.avgDaysToPayment)} days</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="col-lg-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-32 bg-muted/30 rounded animate-pulse"></div>
                  ) : error || !data?.stockAlerts || data.stockAlerts.length === 0 ? (
                    <div className="text-muted-foreground">No low stock products.</div>
                  ) : (
                    <div className="space-y-2">
                      {data.stockAlerts.map((alert) => (
                        <div key={alert.productId} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium text-sm">{alert.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              Stock: {formatStockValue(alert.currentStock, alert.unit)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold text-sm ${alert.daysRemaining < 30 ? 'text-destructive' : alert.daysRemaining < 60 ? 'text-amber-600' : ''}`}>
                              {formatNumber(alert.daysRemaining, 0)} days
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ~{formatMonthlySales(alert.avgMonthlySales, alert.unit)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Customer Stats */}
          <div className="row mb-4">
            <div className="col-12">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-24 bg-muted/30 rounded animate-pulse"></div>
                  ) : error || !data?.customerStats ? (
                    <div className="text-muted-foreground">No customer data available.</div>
                  ) : (
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-semibold">{data.customerStats.totalCustomers}</p>
                        <p className="text-sm text-muted-foreground">Total Customers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold">{data.customerStats.newThisMonth}</p>
                        <p className="text-sm text-muted-foreground">New This Month</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold">{data.customerStats.totalSales}</p>
                        <p className="text-sm text-muted-foreground">Total Sales (YTD)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold">{data.customerStats.oneTimeCustomers}</p>
                        <p className="text-sm text-muted-foreground">One-Time Buyers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold">{data.customerStats.inactiveCustomers}</p>
                        <p className="text-sm text-muted-foreground">Inactive (12mo)</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Customers & Products */}
          <div className="row mb-4">
            <div className="col-lg-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Top 5 Customers (YTD)</CardTitle>
                    <a href="/admin/customers" className="text-sm text-primary hover:underline">
                      View all →
                    </a>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-48 bg-muted/30 rounded animate-pulse"></div>
                  ) : error || !data?.topCustomers || data.topCustomers.length === 0 ? (
                    <div className="text-muted-foreground">No customer data available.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">#</th>
                            <th className="text-left py-2 px-2">Customer</th>
                            <th className="text-right py-2 px-2">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.topCustomers.map((customer, index) => (
                            <tr key={customer.customerId} className="border-b">
                              <td className="py-2 px-2">{index + 1}</td>
                              <td className="py-2 px-2">{customer.customerName}</td>
                              <td className="text-right py-2 px-2">{formatCurrency(customer.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="col-lg-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Top 5 Products (YTD)</CardTitle>
                    <a href="/admin/products" className="text-sm text-primary hover:underline">
                      View all →
                    </a>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-48 bg-muted/30 rounded animate-pulse"></div>
                  ) : error || !data?.topProducts || data.topProducts.length === 0 ? (
                    <div className="text-muted-foreground">No product data available.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">#</th>
                            <th className="text-left py-2 px-2">Product</th>
                            <th className="text-right py-2 px-2">Revenue</th>
                            <th className="text-right py-2 px-2">Qty Sold</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.topProducts.map((product, index) => (
                            <tr key={product.productId} className="border-b">
                              <td className="py-2 px-2">{index + 1}</td>
                              <td className="py-2 px-2">{product.productName}</td>
                              <td className="text-right py-2 px-2">{formatCurrency(product.revenue)}</td>
                              <td className="text-right py-2 px-2">{formatSoldQuantity(product.quantitySold)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* SALES ANALYSIS TAB */}
        <TabsContent value="sales-analysis">
          {/* Summary KPIs - Matching Sales page colors */}
          <div className="row mb-4" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <div className="col-md-4 col-sm-6 mb-3" style={{ display: 'flex' }}>
              <Card className="border-0 w-full bg-[hsl(190,60%,45%)] text-white" style={{ minHeight: '120px' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-white/80 mb-2">Lifetime Revenue</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(salesAnalysis?.lifetimeStats?.totalRevenue || 0)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-md-4 col-sm-6 mb-3" style={{ display: 'flex' }}>
              <Card className="border-0 w-full bg-[hsl(45,90%,55%)] text-white" style={{ minHeight: '120px' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-white/80 mb-2">Best Month Ever</p>
                    <p className="text-xl font-bold text-white">{salesAnalysis?.lifetimeStats?.bestMonth?.label || 'N/A'}</p>
                    <p className="text-sm text-white/70">{formatCurrency(salesAnalysis?.lifetimeStats?.bestMonth?.revenue || 0)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-md-4 col-sm-6 mb-3" style={{ display: 'flex' }}>
              <Card className="border-0 w-full bg-[hsl(355,75%,60%)] text-white" style={{ minHeight: '120px' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-white/80 mb-2">YTD {new Date().getFullYear()}</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(revenueOverview.ytdCurrent.amount)}</p>
                    <p className="text-xs text-white/70 mt-1">
                      vs {revenueOverview.ytdPrevious.year}: {formatSignedPercentage(revenueOverview.ytdChange.percentage)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Year Selector */}
          <div className="row mb-4">
            <div className="col-12">
              <Card>
                <CardHeader>
                  <CardTitle>Year Selector</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(year => (
                      <button
                        key={year}
                        onClick={() => toggleYear(year)}
                        className={`px-4 py-2 rounded-md border ${
                          selectedYears.includes(year)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-input hover:bg-accent'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Select one or more years to update all tables and charts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Multi-Year Revenue Trend Chart */}
          <div className="row mb-4">
            <div className="col-12">
              <Card>
                <CardHeader>
                  <CardTitle>Multi-Year Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <div className="h-80 bg-muted/30 rounded animate-pulse"></div>
                  ) : !salesAnalysis?.monthlyComparison ? (
                    <div className="text-muted-foreground">No data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={salesAnalysis.monthlyComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        {selectedYears.map((year, index) => (
                          <Line
                            key={year}
                            type="monotone"
                            dataKey={`year_${year}`}
                            stroke={CHART_COLORS[index % CHART_COLORS.length]}
                            strokeWidth={2}
                            name={`${year}`}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Year-over-Year Growth */}
          <div className="row mb-4">
            <div className="col-lg-6">
              <Card>
                <CardHeader>
                  <CardTitle>Year-over-Year Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <div className="h-48 bg-muted/30 rounded animate-pulse"></div>
                  ) : !salesAnalysis?.yearOverYearGrowth ? (
                    <div className="text-muted-foreground">No data available.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Year</th>
                            <th className="text-right py-2 px-4">Revenue</th>
                            <th className="text-right py-2 px-4">Growth</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesAnalysis.yearOverYearGrowth.map((item) => (
                            <tr key={item.year} className="border-b">
                              <td className="py-2 px-4">
                                {item.year} {item.isYTD && <span className="text-xs text-muted-foreground">(YTD)</span>}
                              </td>
                              <td className="text-right py-2 px-4">{formatCurrency(item.revenue)}</td>
                              <td className="text-right py-2 px-4">
                                {item.growth !== null ? formatSignedPercentage(item.growth) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Channel Performance Over Time */}
            <div className="col-lg-6">
              <Card>
                <CardHeader>
                  <CardTitle>Channel Performance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <div className="h-48 bg-muted/30 rounded animate-pulse"></div>
                  ) : !salesAnalysis?.channelPerformance ? (
                    <div className="text-muted-foreground">No data available.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Channel</th>
                            {selectedYears.slice(0, 4).map(year => (
                              <th key={year} className="text-right py-2 px-2">{year}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {salesAnalysis.channelPerformance.map((item: any) => (
                            <tr key={item.channel} className="border-b">
                              <td className="py-2 px-2">{channelLabels[item.channel] || item.channel}</td>
                              {selectedYears.slice(0, 4).map(year => (
                                <td key={year} className="text-right py-2 px-2">
                                  {formatCurrency(item[`year_${year}`] || 0)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* INVENTORY TAB */}
        <TabsContent value="inventory">
          {/* Summary KPIs - Matching Sales page colors */}
          <div className="row mb-4" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <div className="col-md-4 col-sm-6 mb-3" style={{ display: 'flex' }}>
              <Card className="border-0 w-full bg-[hsl(190,60%,45%)] text-white" style={{ minHeight: '120px' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-white/80 mb-2">Total SKUs Tracked</p>
                    <p className="text-3xl font-bold text-white">{inventory?.inventoryLevels?.length || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-md-4 col-sm-6 mb-3" style={{ display: 'flex' }}>
              <Card className="border-0 w-full bg-[hsl(45,90%,55%)] text-white" style={{ minHeight: '120px' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-white/80 mb-2">Low Stock Items</p>
                    <p className="text-3xl font-bold text-white">
                      {inventory?.inventoryLevels?.filter(item => item.daysRemaining < 60).length || 0}
                    </p>
                    <p className="text-xs text-white/70 mt-1">{'<'} 60 days remaining</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-md-4 col-sm-6 mb-3" style={{ display: 'flex' }}>
              <Card className="border-0 w-full bg-[hsl(355,75%,60%)] text-white" style={{ minHeight: '120px' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-white/80 mb-2">Critical Items</p>
                    <p className="text-3xl font-bold text-white">
                      {inventory?.inventoryLevels?.filter(item => item.daysRemaining < 30).length || 0}
                    </p>
                    <p className="text-xs text-white/70 mt-1">{'<'} 30 days remaining</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stock Levels Table */}
          <div className="row mb-4">
            <div className="col-12">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  {inventoryLoading ? (
                    <div className="h-96 bg-muted/30 rounded animate-pulse"></div>
                  ) : !inventory?.inventoryLevels || inventory.inventoryLevels.length === 0 ? (
                    <div className="text-muted-foreground">No inventory data available.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Product Name</th>
                            <th className="text-right py-2 px-3">Current Stock</th>
                            <th className="text-right py-2 px-3">Avg/Month</th>
                            <th className="text-right py-2 px-3">Days Remaining</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.inventoryLevels.map((item) => (
                            <tr key={item.productId} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-3">{item.productName}</td>
                              <td className="text-right py-2 px-3">{formatStockValue(item.currentStock, item.unit)}</td>
                              <td className="text-right py-2 px-3">{formatMonthlySales(item.avgMonthlySales, item.unit)}</td>
                              <td className={`text-right py-2 px-3 font-semibold ${
                                item.daysRemaining < 30
                                  ? 'text-destructive'
                                  : item.daysRemaining < 60
                                  ? 'text-amber-600'
                                  : 'text-foreground'
                              }`}>
                                {formatNumber(item.daysRemaining, 0)} days
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
