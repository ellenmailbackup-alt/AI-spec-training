import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/currency";

type VarianceRecord = {
  productId: number;
  productName: string;
  unit: string;
  countedQuantity: number;
  expectedStock: number;
  variance: number;
  variancePercentage: number;
  status: 'match' | 'surplus' | 'missing';
};

// Format unit for display
const formatUnit = (unit: string): string => {
  if (unit === 'stuk' || unit === 'piece' || unit === 'pcs') {
    return 'stuk';
  }
  return 'g';
};

// Variance status styling - Story 3
const getVarianceClass = (status: string) => {
  switch (status) {
    case 'match':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'surplus':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'missing':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getVarianceIcon = (status: string) => {
  switch (status) {
    case 'match':
      return <CheckCircle className="w-4 h-4" />;
    case 'surplus':
      return <TrendingUp className="w-4 h-4" />;
    case 'missing':
      return <TrendingDown className="w-4 h-4" />;
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
};

const formatVariance = (variance: number): string => {
  return variance > 0 ? `+${formatNumber(variance, 2)}` : formatNumber(variance, 2);
};

interface VarianceAnalysisTableProps {
  sessionId: number;
  onEdit?: (productId: number) => void;
}

export function VarianceAnalysisTable({ sessionId, onEdit }: VarianceAnalysisTableProps) {
  const [, setLocation] = useLocation();
  
  // Fetch variance analysis
  const { data: varianceData = [], isLoading, refetch } = useQuery<VarianceRecord[]>({
    queryKey: [`/api/counting-sessions/${sessionId}/variance-analysis`],
    staleTime: 0, // Always consider data stale for manual refresh
  });

  const handleRefresh = () => {
    refetch();
  };

  // Navigate to stock movements for a product with return URL
  const handleViewStockMovements = (productId: number) => {
    const currentYear = new Date().getFullYear();
    const returnUrl = encodeURIComponent(`/admin/counting-sessions/${sessionId}?tab=variance-analysis`);
    setLocation(`/admin/products/${productId}/stock-movements?year=${currentYear}&returnUrl=${returnUrl}`);
  };

  // Calculate summary stats
  const totalProducts = varianceData.length;
  const matchedProducts = varianceData.filter(v => v.status === 'match').length;
  const surplusProducts = varianceData.filter(v => v.status === 'surplus').length;
  const missingProducts = varianceData.filter(v => v.status === 'missing').length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-lg text-gray-500">Loading variance analysis...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (varianceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No products counted yet. Add count entries to see variance analysis.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Variance Analysis (Real-Time)</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Expected stock is calculated in real-time from all stock movements.
          Refresh to update if sales occurred during counting.
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="text-xs text-gray-600">Total Products</div>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </div>
          <div className="border rounded-lg p-3 bg-green-50 border-green-200">
            <div className="text-xs text-green-700">Matched</div>
            <div className="text-2xl font-bold text-green-700">{matchedProducts}</div>
          </div>
          <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
            <div className="text-xs text-blue-700">Surplus</div>
            <div className="text-2xl font-bold text-blue-700">{surplusProducts}</div>
          </div>
          <div className="border rounded-lg p-3 bg-red-50 border-red-200">
            <div className="text-xs text-red-700">Missing</div>
            <div className="text-2xl font-bold text-red-700">{missingProducts}</div>
          </div>
        </div>

        {/* Variance Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left p-3 font-semibold">Product</th>
                <th className="text-right p-3 font-semibold">Expected Stock</th>
                <th className="text-right p-3 font-semibold">Counted</th>
                <th className="text-right p-3 font-semibold">Variance</th>
                <th className="text-right p-3 font-semibold">Variance %</th>
                <th className="text-center p-3 font-semibold">Status</th>
                <th className="text-center p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {varianceData.map((record) => (
                <tr
                  key={record.productId}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3 font-medium">{record.productName}</td>
                  <td className="p-3 text-right text-gray-700">
                    {formatNumber(record.expectedStock, 2)} {formatUnit(record.unit)}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatNumber(record.countedQuantity, 2)} {formatUnit(record.unit)}
                  </td>
                  <td className={`p-3 text-right font-bold ${
                    Number(record.variance) === 0 ? 'text-green-600' :
                    Number(record.variance) > 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {formatVariance(Number(record.variance))} {formatUnit(record.unit)}
                  </td>
                  <td className={`p-3 text-right font-medium ${
                    Number(record.variance) === 0 ? 'text-green-600' :
                    Number(record.variance) > 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {formatVariance(Number(record.variancePercentage))}%
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getVarianceClass(record.status)}`}>
                      {getVarianceIcon(record.status)}
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStockMovements(record.productId)}
                      data-testid={`button-view-stock-movements-${record.productId}`}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Movements
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-semibold mb-2">Variance Legend:</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span><strong>Match:</strong> Counted = Expected (0 variance)</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span><strong>Surplus:</strong> Counted &gt; Expected (positive variance)</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span><strong>Missing:</strong> Counted &lt; Expected (negative variance)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
