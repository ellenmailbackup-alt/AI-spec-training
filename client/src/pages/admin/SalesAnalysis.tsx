import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatPercentage } from "@/lib/currency";
import { Download, ArrowDownRight, ArrowUpRight, Minus, Trophy } from "lucide-react";

type MonthlyComparisonRow = {
  month: string;
  monthNumber: number;
  [year: string]: number | string;
};

type MonthlyComparisonResponse = {
  months: MonthlyComparisonRow[];
  totals: Record<string, number>;
};

type LifetimeStatsResponse = {
  totalAllTime: number;
  bestMonth: { month: string; year: number; revenue: number } | null;
  annualGrowth: Array<{
    year: number;
    revenue: number;
    growthPercentage: number | null;
    ytd?: boolean;
  }>;
};

type ChannelTrendsResponse = {
  currentYear: number;
  previousYear: number;
  channels: Array<{
    channel: string;
    revenues: Record<string, number>;
    growthRate: number | null;
  }>;
};

const CHART_COLORS = ["#5D4037", "#2E7D32", "#D4A574", "#8D6E63", "#66BB6A", "#BCAAA4"];

const toCsvValue = (value: string | number) => {
  const sanitized = String(value).replace(/"/g, '""');
  return `"${sanitized}"`;
};

const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
  const csv = [headers, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const buildChange = (current: number, previous: number) => {
  const absolute = current - previous;
  if (previous === 0) {
    return {
      absolute,
      percentage: null as number | null,
      trend: absolute === 0 ? "flat" : "up",
    };
  }

  const percentage = (absolute / previous) * 100;
  const trend = absolute === 0 ? "flat" : absolute > 0 ? "up" : "down";
  return { absolute, percentage, trend };
};

const formatSignedPercentage = (value: number | null, decimals = 1) => {
  if (value === null) {
    return "N/A";
  }
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatPercentage(Math.abs(value), decimals)}`;
};

export default function SalesAnalysis() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const initialYears = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const [selectedYears, setSelectedYears] = useState<number[]>(initialYears);
  const [hiddenYears, setHiddenYears] = useState<Record<string, boolean>>({});

  const sortedYears = useMemo(
    () => [...selectedYears].sort((a, b) => b - a),
    [selectedYears]
  );

  useEffect(() => {
    setHiddenYears((prev) => {
      const next = { ...prev };
      sortedYears.forEach((year) => {
        if (next[String(year)] === undefined) {
          next[String(year)] = false;
        }
      });
      Object.keys(next).forEach((yearKey) => {
        if (!sortedYears.includes(Number(yearKey))) {
          delete next[yearKey];
        }
      });
      return next;
    });
  }, [sortedYears]);

  const yearsParam = sortedYears.join(",");

  const {
    data: monthlyComparison,
    isLoading: isMonthlyLoading,
    error: monthlyError,
  } = useQuery<MonthlyComparisonResponse>({
    queryKey: [`/api/analytics/sales/monthly-comparison?years=${yearsParam}`],
  });

  const {
    data: lifetimeStats,
    isLoading: isLifetimeLoading,
    error: lifetimeError,
  } = useQuery<LifetimeStatsResponse>({
    queryKey: ["/api/analytics/sales/lifetime-stats"],
  });

  const {
    data: channelTrends,
    isLoading: isChannelLoading,
    error: channelError,
  } = useQuery<ChannelTrendsResponse>({
    queryKey: [`/api/analytics/sales/channel-trends?years=${yearsParam}`],
  });

  const isLoading = isMonthlyLoading || isLifetimeLoading || isChannelLoading;
  const error = monthlyError || lifetimeError || channelError;

  // Get all available years from the lifetime stats data (years that have sales)
  const availableYears = useMemo(() => {
    if (!lifetimeStats?.annualGrowth) {
      return initialYears;
    }
    const yearsFromData = lifetimeStats.annualGrowth.map((row) => row.year);
    // Ensure current year is included even if no data yet
    if (!yearsFromData.includes(currentYear)) {
      yearsFromData.push(currentYear);
    }
    return yearsFromData.sort((a, b) => b - a);
  }, [lifetimeStats, currentYear]);

  const toggleYear = (year: number) => {
    setSelectedYears((prev) => {
      const exists = prev.includes(year);
      if (exists && prev.length === 1) {
        return prev;
      }
      if (exists) {
        return prev.filter((value) => value !== year);
      }
      return [...prev, year];
    });
  };

  const chartData = useMemo(() => {
    if (!monthlyComparison) {
      return [];
    }

    return monthlyComparison.months.map((row) => {
      const next: Record<string, number | string | null> = { ...row };
      sortedYears.forEach((year) => {
        const value = Number(row[String(year)] ?? 0);
        if (year === currentYear && row.monthNumber > currentMonth) {
          next[String(year)] = null;
        } else {
          next[String(year)] = value;
        }
      });
      return next;
    });
  }, [monthlyComparison, sortedYears, currentYear, currentMonth]);

  const [primaryYear, comparisonYear] = sortedYears;
  const comparisonLabel = comparisonYear ? `${primaryYear} vs ${comparisonYear}` : `${primaryYear}`;

  const annualGrowthRows = useMemo(() => {
    if (!lifetimeStats) {
      return [];
    }

    return lifetimeStats.annualGrowth.filter((row) => selectedYears.includes(row.year));
  }, [lifetimeStats, selectedYears]);

  
  const channelHighlights = useMemo(() => {
    if (!channelTrends) {
      return { fastestGrower: null as string | null, fastestDecline: null as string | null };
    }

    const sortedByGrowth = [...channelTrends.channels].sort((a, b) => {
      const aGrowth = a.growthRate ?? -Infinity;
      const bGrowth = b.growthRate ?? -Infinity;
      return bGrowth - aGrowth;
    });

    const positive = sortedByGrowth.find((entry) => (entry.growthRate ?? 0) > 0);
    const negative = [...sortedByGrowth].reverse().find((entry) => (entry.growthRate ?? 0) < 0);

    return {
      fastestGrower: positive?.channel ?? null,
      fastestDecline: negative?.channel ?? null,
    };
  }, [channelTrends]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-sm text-muted-foreground">Loading sales analysis...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-sm text-destructive">Failed to load sales analysis data.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="mb-1 text-sm text-muted-foreground">Dashboard &gt; Sales Analysis</div>
        <h1 className="text-2xl font-serif font-semibold">Sales Analysis</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Year Selector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {availableYears.map((year) => (
              <label key={year} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedYears.includes(year)}
                  onCheckedChange={() => toggleYear(year)}
                />
                {year}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Select one or more years to update all tables and charts.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Month-by-Month Revenue Comparison</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!monthlyComparison) {
                  return;
                }
                const headers = ["Month", ...sortedYears.map(String), `Change (${comparisonLabel})`];
                const rows = monthlyComparison.months.map((row) => {
                  const current = Number(row[String(primaryYear)] ?? 0);
                  const previous = comparisonYear ? Number(row[String(comparisonYear)] ?? 0) : 0;
                  const change = comparisonYear ? buildChange(current, previous) : null;
                  const changeText = change
                    ? `${change.absolute >= 0 ? "+" : "-"}${formatCurrency(Math.abs(change.absolute))} (${formatSignedPercentage(
                        change.percentage,
                        1
                      )})`
                    : "-";
                  return [
                    row.month,
                    ...sortedYears.map((year) => formatCurrency(Number(row[String(year)] ?? 0))),
                    changeText,
                  ];
                });
                downloadCsv("monthly-comparison.csv", headers, rows);
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    {sortedYears.map((year) => (
                      <TableHead key={year}>{year}</TableHead>
                    ))}
                    <TableHead>Change ({comparisonLabel})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyComparison?.months.map((row) => {
                    const currentValue = Number(row[String(primaryYear)] ?? 0);
                    const previousValue = comparisonYear ? Number(row[String(comparisonYear)] ?? 0) : 0;
                    const change = comparisonYear ? buildChange(currentValue, previousValue) : null;
                    const trendIcon =
                      change?.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : change?.trend === "down" ? (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      );

                    return (
                      <TableRow
                        key={row.month}
                        className={row.monthNumber === currentMonth ? "bg-muted/40 font-semibold" : undefined}
                      >
                        <TableCell>{row.month}</TableCell>
                        {sortedYears.map((year) => {
                          const value = Number(row[String(year)] ?? 0);
                          const isFuture = year === currentYear && row.monthNumber > currentMonth;
                          return (
                            <TableCell key={year} className={isFuture ? "text-muted-foreground" : undefined}>
                              {isFuture ? "—" : formatCurrency(value)}
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          {comparisonYear ? (
                            <div className="flex items-center gap-2 text-sm">
                              <span>
                                {change && change.absolute !== 0
                                  ? `${change.absolute > 0 ? "+" : "-"}${formatCurrency(
                                      Math.abs(change.absolute)
                                    )}`
                                  : formatCurrency(0)}
                              </span>
                              <span className="text-muted-foreground">
                                {formatSignedPercentage(change?.percentage ?? null, 1)}
                              </span>
                              {trendIcon}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {monthlyComparison && (
                    <TableRow className="font-semibold">
                      <TableCell>Total</TableCell>
                      {sortedYears.map((year) => (
                        <TableCell key={year}>
                          {formatCurrency(monthlyComparison.totals[String(year)] ?? 0)}
                        </TableCell>
                      ))}
                      <TableCell>
                        {comparisonYear ? (
                          (() => {
                            const currentTotal = monthlyComparison.totals[String(primaryYear)] ?? 0;
                            const previousTotal = monthlyComparison.totals[String(comparisonYear)] ?? 0;
                            const change = buildChange(currentTotal, previousTotal);
                            return (
                              <div className="flex items-center gap-2 text-sm">
                                <span>
                                  {change.absolute > 0 ? "+" : change.absolute < 0 ? "-" : ""}
                                  {formatCurrency(Math.abs(change.absolute))}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatSignedPercentage(change.percentage, 1)}
                                </span>
                                {change.trend === "up" ? (
                                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                                ) : change.trend === "down" ? (
                                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                                ) : (
                                  <Minus className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Multi-Year Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `€${(value / 1000000).toLocaleString('nl-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
                    }
                    if (value >= 1000) {
                      return `€${(value / 1000).toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k`;
                    }
                    return `€${value.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                  }} 
                />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend
                  onClick={(payload) => {
                    if (!payload || !payload.dataKey) return;
                    const key = String(payload.dataKey);
                    setHiddenYears((prev) => ({ ...prev, [key]: !prev[key] }));
                  }}
                  formatter={(value) => {
                    const key = String(value);
                    const isHidden = hiddenYears[key];
                    return <span className={isHidden ? "line-through text-muted-foreground" : undefined}>{key}</span>;
                  }}
                />
                {sortedYears.map((year, index) =>
                  hiddenYears[String(year)] ? null : (
                    <Line
                      key={year}
                      type="monotone"
                      dataKey={String(year)}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  )
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lifetime Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Total All-Time Revenue</div>
                <div className="text-2xl font-semibold">{formatCurrency(lifetimeStats?.totalAllTime ?? 0)}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Best Month Ever</div>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  {lifetimeStats?.bestMonth
                    ? `${lifetimeStats.bestMonth.month} ${lifetimeStats.bestMonth.year} • ${formatCurrency(
                        lifetimeStats.bestMonth.revenue
                      )}`
                    : "No data yet"}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Year-over-Year Growth</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!annualGrowthRows.length) {
                      return;
                    }
                    const headers = ["Year", "Revenue", "Growth"];
                    const rows = annualGrowthRows.map((row) => [
                      row.year,
                      formatCurrency(row.revenue),
                      formatSignedPercentage(row.growthPercentage, 1),
                    ]);
                    downloadCsv("annual-growth.csv", headers, rows);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {annualGrowthRows.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell>
                          {row.year} {row.ytd ? "(YTD)" : ""}
                        </TableCell>
                        <TableCell>{formatCurrency(row.revenue)}</TableCell>
                        <TableCell>
                          {formatSignedPercentage(row.growthPercentage, 1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Channel Performance Over Time</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!channelTrends) {
                  return;
                }
                const headers = ["Channel", ...sortedYears.map(String), "Growth"];
                const rows = channelTrends.channels.map((row) => [
                  row.channel,
                  ...sortedYears.map((year) => formatCurrency(row.revenues[String(year)] ?? 0)),
                  formatSignedPercentage(row.growthRate, 1),
                ]);
                downloadCsv("channel-trends.csv", headers, rows);
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    {sortedYears.map((year) => (
                      <TableHead key={year}>{year === channelTrends?.currentYear ? `${year} (YTD)` : year}</TableHead>
                    ))}
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channelTrends?.channels.map((row) => {
                    const isFastestGrower = row.channel === channelHighlights.fastestGrower;
                    const isFastestDecline = row.channel === channelHighlights.fastestDecline;
                    return (
                      <TableRow
                        key={row.channel}
                        className={
                          isFastestGrower
                            ? "bg-green-50"
                            : isFastestDecline
                              ? "bg-red-50"
                              : undefined
                        }
                      >
                        <TableCell>{row.channel}</TableCell>
                        {sortedYears.map((year) => (
                          <TableCell key={year}>{formatCurrency(row.revenues[String(year)] ?? 0)}</TableCell>
                        ))}
                        <TableCell>
                          {formatSignedPercentage(row.growthRate, 1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Growth compares {channelTrends?.previousYear} YTD to {channelTrends?.currentYear} YTD for the same period.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
