import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { Download, Search, ArrowUpDown, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

type StockStatus = "critical" | "low" | "good" | "unknown";

type ProductStockLevel = {
  id: number;
  productName: string;
  category: string;
  currentStock: number;
  avgMonthlyUsage: number;
  daysRemaining: number | null;
  status: StockStatus;
};

type StockMovementSummary = {
  category: string;
  stockIn: number;
  stockOut: number;
  netChange: number;
};

type RecentMovement = {
  date: string;
  productName: string;
  type: string;
  quantity: number;
  notes: string | null;
};

type InventoryResponse = {
  products: ProductStockLevel[];
  totalCount: number;
};

type MovementSummaryResponse = {
  summary: StockMovementSummary[];
};

type RecentMovementsResponse = {
  movements: RecentMovement[];
};

const getStatusIcon = (status: StockStatus) => {
  switch (status) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "low":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case "good":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    default:
      return null;
  }
};

const getStatusColor = (status: StockStatus) => {
  switch (status) {
    case "critical":
      return "bg-red-50 border-red-200";
    case "low":
      return "bg-yellow-50 border-yellow-200";
    case "good":
      return "";
    default:
      return "";
  }
};

const formatQuantity = (quantity: number) => {
  // Format with nl-BE locale (comma as decimal separator)
  // Show 2 decimals, but trim trailing zeros
  const formatted = formatNumber(quantity, 2);
  // Remove trailing zeros after decimal comma
  return formatted.replace(/,?0+$/, "").replace(/,$/, "");
};

const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
  const toCsvValue = (value: string | number) => {
    const sanitized = String(value).replace(/"/g, '""');
    return `"${sanitized}"`;
  };

  const csv = [headers, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function Inventory() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("daysRemaining");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    return params.toString();
  }, [category, search, sortBy, sortOrder]);

  const {
    data: inventoryData,
    isLoading: isInventoryLoading,
    error: inventoryError,
  } = useQuery<InventoryResponse>({
    queryKey: [`/api/inventory${queryParams ? `?${queryParams}` : ""}`],
  });

  const {
    data: movementSummary,
    isLoading: isMovementLoading,
    error: movementError,
  } = useQuery<MovementSummaryResponse>({
    queryKey: ["/api/inventory/movement-summary?days=30"],
  });

  const {
    data: recentMovements,
    isLoading: isRecentLoading,
    error: recentError,
  } = useQuery<RecentMovementsResponse>({
    queryKey: ["/api/inventory/recent-movements?limit=20"],
  });

  const isLoading = isInventoryLoading || isMovementLoading || isRecentLoading;
  const error = inventoryError || movementError || recentError;

  const categories = useMemo(() => {
    if (!inventoryData?.products) return ["all"];
    const uniqueCategories = new Set(inventoryData.products.map((p) => p.category));
    return ["all", ...Array.from(uniqueCategories).sort()];
  }, [inventoryData]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const exportStockLevels = () => {
    if (!inventoryData?.products) return;

    const headers = [
      "Product Name",
      "Category",
      "Current Stock",
      "Avg/Month",
      "Days Remaining",
      "Status",
    ];

    const rows = inventoryData.products.map((product) => [
      product.productName,
      product.category,
      formatQuantity(product.currentStock),
      formatQuantity(product.avgMonthlyUsage),
      product.daysRemaining !== null ? product.daysRemaining.toFixed(0) : "N/A",
      product.status,
    ]);

    downloadCsv("inventory-stock-levels.csv", headers, rows);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-sm text-muted-foreground">Loading inventory...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-sm text-destructive">Failed to load inventory data.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="mb-1 text-sm text-muted-foreground">Dashboard &gt; Inventory</div>
        <h1 className="text-2xl font-serif font-semibold">Inventory Overview</h1>
      </div>

      <div className="grid gap-6">
        {/* Stock Movement Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Movement Summary (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {movementSummary?.summary && movementSummary.summary.length > 0 ? (
              (() => {
                // Priority categories appear first with enhanced styling
                const priorityCategories = ["COFFEE", "TEA"];
                const sortedSummary = [...movementSummary.summary].sort((a, b) => {
                  const aIsPriority = priorityCategories.includes(a.category.toUpperCase());
                  const bIsPriority = priorityCategories.includes(b.category.toUpperCase());
                  if (aIsPriority && !bIsPriority) return -1;
                  if (!aIsPriority && bIsPriority) return 1;
                  return a.category.localeCompare(b.category);
                });

                const priorityItems = sortedSummary.filter(item => 
                  priorityCategories.includes(item.category.toUpperCase())
                );
                const otherItems = sortedSummary.filter(item => 
                  !priorityCategories.includes(item.category.toUpperCase())
                );

                return (
                  <div className="space-y-4">
                    {/* Priority categories: Coffee & Tea - larger hero cards */}
                    {priorityItems.length > 0 && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {priorityItems.map((item) => (
                          <div
                            key={item.category}
                            className={`rounded-lg border-2 p-5 ${
                              item.netChange < 0 
                                ? "border-red-300 bg-red-50" 
                                : item.netChange > 0 
                                  ? "border-green-300 bg-green-50" 
                                  : "border-amber-300 bg-amber-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">☕</span>
                              <div className="text-base font-bold text-foreground">{item.category}</div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">In</div>
                                <div className="text-lg font-semibold text-green-700">
                                  +{formatQuantity(item.stockIn)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Out</div>
                                <div className="text-lg font-semibold text-red-700">
                                  -{formatQuantity(item.stockOut)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Net</div>
                                <div
                                  className={`text-lg font-semibold ${item.netChange < 0 ? "text-red-700" : item.netChange > 0 ? "text-green-700" : "text-muted-foreground"}`}
                                >
                                  {item.netChange > 0 ? "+" : ""}
                                  {formatQuantity(item.netChange)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Other categories - smaller standard cards */}
                    {otherItems.length > 0 && (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {otherItems.map((item) => (
                          <div
                            key={item.category}
                            className={`rounded-lg border p-4 ${item.netChange < 0 ? "border-red-200 bg-red-50" : item.netChange > 0 ? "border-green-200 bg-green-50" : ""}`}
                          >
                            <div className="text-sm font-semibold text-muted-foreground">{item.category}</div>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="text-muted-foreground">In</div>
                                <div className="font-semibold text-green-700">
                                  +{formatQuantity(item.stockIn)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Out</div>
                                <div className="font-semibold text-red-700">
                                  -{formatQuantity(item.stockOut)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Net</div>
                                <div
                                  className={`font-semibold ${item.netChange < 0 ? "text-red-700" : item.netChange > 0 ? "text-green-700" : "text-muted-foreground"}`}
                                >
                                  {item.netChange > 0 ? "+" : ""}
                                  {formatQuantity(item.netChange)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-sm text-muted-foreground">No stock movements in the last 30 days.</div>
            )}
          </CardContent>
        </Card>

        {/* Stock Levels Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Stock Levels</CardTitle>
            <Button variant="outline" size="sm" onClick={exportStockLevels}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {inventoryData?.products && inventoryData.products.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("productName")}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Product Name <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("category")}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Category <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSort("currentStock")}
                          className="flex items-center gap-1 hover:text-foreground ml-auto"
                        >
                          Current Stock <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSort("avgMonthlyUsage")}
                          className="flex items-center gap-1 hover:text-foreground ml-auto"
                        >
                          Avg/Month <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSort("daysRemaining")}
                          className="flex items-center gap-1 hover:text-foreground ml-auto"
                        >
                          Days Remaining <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.products.map((product) => (
                      <TableRow
                        key={product.id}
                        className={getStatusColor(product.status)}
                      >
                        <TableCell>{getStatusIcon(product.status)}</TableCell>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {product.category}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatQuantity(product.currentStock)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatQuantity(product.avgMonthlyUsage)}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.daysRemaining !== null ? (
                            <span
                              className={
                                product.status === "critical"
                                  ? "font-semibold text-red-700"
                                  : product.status === "low"
                                    ? "font-semibold text-yellow-700"
                                    : ""
                              }
                            >
                              {formatNumber(product.daysRemaining, 0)} days
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-2 text-xs text-muted-foreground">
                  Showing {inventoryData.products.length} product
                  {inventoryData.products.length !== 1 ? "s" : ""}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No products found.</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Stock Movements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMovements?.movements && recentMovements.movements.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMovements.movements.map((movement, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm">{movement.date}</TableCell>
                        <TableCell className="font-medium">{movement.productName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.type}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              movement.quantity > 0
                                ? "font-semibold text-green-700"
                                : "font-semibold text-red-700"
                            }
                          >
                            {movement.quantity > 0 ? "+" : ""}
                            {formatQuantity(movement.quantity)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No recent stock movements.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
