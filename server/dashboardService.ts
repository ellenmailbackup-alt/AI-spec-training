/**
 * Dashboard Service Layer
 *
 * Handles dashboard-specific business logic and aggregates.
 */
import { storage } from "./storage";

type RevenueChange = {
  absolute: number;
  percentage: number | null;
  trend: "up" | "down" | "flat";
};

export type RevenueOverview = {
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

const SHIPPED_STATUS_ID = 2;
const INVOICED_STATUS_ID = 3;
const PAID_STATUS_ID = 4;
const REVENUE_STATUS_IDS = [SHIPPED_STATUS_ID, INVOICED_STATUS_ID, PAID_STATUS_ID];

const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const clampDay = (year: number, month: number, day: number): Date => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(year, month, safeDay);
};

const buildChange = (current: number, previous: number): RevenueChange => {
  if (previous === 0) {
    if (current === 0) {
      return { absolute: 0, percentage: 0, trend: "flat" };
    }
    return { absolute: current, percentage: null, trend: "up" };
  }

  const absolute = current - previous;
  const percentage = (absolute / previous) * 100;
  const trend = absolute === 0 ? "flat" : absolute > 0 ? "up" : "down";

  return { absolute, percentage, trend };
};

export class DashboardService {
  async getRevenueOverview(referenceDate = new Date()): Promise<RevenueOverview> {
    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth();
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    const previousYear = currentYear - 1;
    const previousMonthStart = new Date(previousYear, currentMonth, 1);
    const previousMonthEnd = new Date(previousYear, currentMonth + 1, 0);

    const ytdCurrentStart = new Date(currentYear, 0, 1);
    const ytdCurrentEnd = referenceDate;

    const ytdPreviousStart = new Date(previousYear, 0, 1);
    const ytdPreviousEnd = clampDay(previousYear, referenceDate.getMonth(), referenceDate.getDate());

    const [currentMonthRevenue, previousMonthRevenue, ytdCurrentRevenue, ytdPreviousRevenue] =
      await Promise.all([
        storage.getRevenueForDateRange(formatDate(currentMonthStart), formatDate(currentMonthEnd), REVENUE_STATUS_IDS),
        storage.getRevenueForDateRange(formatDate(previousMonthStart), formatDate(previousMonthEnd), REVENUE_STATUS_IDS),
        storage.getRevenueForDateRange(formatDate(ytdCurrentStart), formatDate(ytdCurrentEnd), REVENUE_STATUS_IDS),
        storage.getRevenueForDateRange(formatDate(ytdPreviousStart), formatDate(ytdPreviousEnd), REVENUE_STATUS_IDS),
      ]);

    return {
      currentMonth: {
        amount: currentMonthRevenue,
        year: currentYear,
        month: currentMonth + 1,
        label: monthLabels[currentMonth],
      },
      previousYearMonth: {
        amount: previousMonthRevenue,
        year: previousYear,
        month: currentMonth + 1,
        label: monthLabels[currentMonth],
      },
      currentMonthChange: buildChange(currentMonthRevenue, previousMonthRevenue),
      ytdCurrent: {
        amount: ytdCurrentRevenue,
        year: currentYear,
      },
      ytdPrevious: {
        amount: ytdPreviousRevenue,
        year: previousYear,
      },
      ytdChange: buildChange(ytdCurrentRevenue, ytdPreviousRevenue),
    };
  }

  async getRevenueByChannel(referenceDate = new Date()) {
    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth();
    const previousYear = currentYear - 1;

    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    const previousMonthStart = new Date(previousYear, currentMonth, 1);
    const previousMonthEnd = new Date(previousYear, currentMonth + 1, 0);

    const channels = ['B2B', 'B2C', 'WEBSHOP', 'BOEREN_EN_BUREN'] as const;

    const channelData = await Promise.all(
      channels.map(async (channel) => {
        const [currentRevenue, previousRevenue] = await Promise.all([
          storage.getRevenueForChannel(
            formatDate(currentMonthStart),
            formatDate(currentMonthEnd),
            channel,
            REVENUE_STATUS_IDS
          ),
          storage.getRevenueForChannel(
            formatDate(previousMonthStart),
            formatDate(previousMonthEnd),
            channel,
            REVENUE_STATUS_IDS
          ),
        ]);

        return {
          channel,
          currentMonth: currentRevenue,
          previousMonth: previousRevenue,
          change: buildChange(currentRevenue, previousRevenue),
        };
      })
    );

    return channelData;
  }

  async getMonthlySalesTrend(referenceDate = new Date()) {
    const currentYear = referenceDate.getFullYear();
    const previousYear = currentYear - 1;

    const months = Array.from({ length: 12 }, (_, i) => i);
    const monthlyData = await Promise.all(
      months.map(async (monthIndex) => {
        const monthStart = new Date(currentYear, monthIndex, 1);
        const monthEnd = new Date(currentYear, monthIndex + 1, 0);
        const prevMonthStart = new Date(previousYear, monthIndex, 1);
        const prevMonthEnd = new Date(previousYear, monthIndex + 1, 0);

        const [currentRevenue, previousRevenue] = await Promise.all([
          storage.getRevenueForDateRange(
            formatDate(monthStart),
            formatDate(monthEnd),
            REVENUE_STATUS_IDS
          ),
          storage.getRevenueForDateRange(
            formatDate(prevMonthStart),
            formatDate(prevMonthEnd),
            REVENUE_STATUS_IDS
          ),
        ]);

        return {
          month: monthLabels[monthIndex],
          monthNumber: monthIndex + 1,
          currentYear: currentRevenue,
          previousYear: previousRevenue,
        };
      })
    );

    return monthlyData;
  }

  async getSalesByCategory(referenceDate = new Date()) {
    const currentYear = referenceDate.getFullYear();
    const ytdStart = new Date(currentYear, 0, 1);
    const ytdEnd = referenceDate;

    return await storage.getRevenueByCategory(
      formatDate(ytdStart),
      formatDate(ytdEnd),
      REVENUE_STATUS_IDS
    );
  }

  async getInvoiceHealth(referenceDate = new Date()) {
    const [outstanding, overdue, avgDaysToPayment] = await Promise.all([
      storage.getOutstandingInvoices(),
      storage.getOverdueInvoices(15), // 15 days threshold
      storage.getAverageDaysToPayment(12), // last 12 months
    ]);

    return {
      outstandingAmount: outstanding.amount,
      outstandingCount: outstanding.count,
      overdueAmount: overdue.amount,
      overdueCount: overdue.count,
      avgDaysToPayment: avgDaysToPayment,
      targetDays: 15,
    };
  }

  async getStockAlerts() {
    return await storage.getLowStockProducts(3, 12); // top 3, 12-month average
  }

  async getCustomerStats(referenceDate = new Date()) {
    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth();

    const [
      totalCustomers,
      newCustomersThisMonth,
      oneTimeCustomers,
      inactiveCustomers,
      totalSales
    ] = await Promise.all([
      storage.getTotalCustomers(),
      storage.getNewCustomersThisMonth(currentYear, currentMonth),
      storage.getOneTimeCustomers(),
      storage.getInactiveCustomers(12), // 12 months threshold
      storage.getSalesCount(currentYear),
    ]);

    return {
      totalCustomers,
      newThisMonth: newCustomersThisMonth,
      oneTimeCustomers,
      inactiveCustomers,
      totalSales,
    };
  }

  async getTopCustomers(referenceDate = new Date()) {
    const currentYear = referenceDate.getFullYear();
    return await storage.getTopCustomersByRevenue(currentYear, [INVOICED_STATUS_ID, PAID_STATUS_ID], 5);
  }

  async getTopProducts(referenceDate = new Date()) {
    const currentYear = referenceDate.getFullYear();
    return await storage.getTopProductsByRevenue(currentYear, [INVOICED_STATUS_ID, PAID_STATUS_ID], 5);
  }

  // Sales Analysis Dashboard Methods
  async getMultiYearRevenueComparison(years: number[], referenceDate = new Date()) {
    const currentMonth = referenceDate.getDate();
    const months = Array.from({ length: 12 }, (_, i) => i);

    const monthlyData = await Promise.all(
      months.map(async (monthIndex) => {
        const yearRevenues = await Promise.all(
          years.map(async (year) => {
            const monthStart = new Date(year, monthIndex, 1);
            const monthEnd = new Date(year, monthIndex + 1, 0);

            // Use REVENUE_STATUS_IDS for consistency with YTD calculations
            const revenue = await storage.getRevenueForDateRange(
              formatDate(monthStart),
              formatDate(monthEnd),
              REVENUE_STATUS_IDS
            );

            return { year, revenue };
          })
        );

        const result: any = {
          month: monthLabels[monthIndex],
          monthNumber: monthIndex + 1,
        };

        yearRevenues.forEach(({ year, revenue }) => {
          result[`year_${year}`] = revenue;
        });

        return result;
      })
    );

    return monthlyData;
  }

  async getLifetimeStatistics() {
    // Get lifetime statistics using existing storage methods (optimized single queries)
    // Use REVENUE_STATUS_IDS for consistency with YTD calculations
    const [totalRevenue, bestMonth] = await Promise.all([
      storage.getAllTimeRevenue(REVENUE_STATUS_IDS),
      storage.getBestRevenueMonth(REVENUE_STATUS_IDS),
    ]);
    
    return {
      totalRevenue,
      bestMonth: bestMonth 
        ? {
            month: bestMonth.month,
            year: bestMonth.year,
            revenue: bestMonth.revenue,
            label: `${monthLabels[bestMonth.month - 1]} ${bestMonth.year}`,
          }
        : { month: 0, year: 0, revenue: 0, label: 'N/A' },
    };
  }

  async getYearOverYearGrowth(referenceDate = new Date()) {
    const currentYear = referenceDate.getFullYear();
    const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

    const yearlyData = await Promise.all(
      years.map(async (year) => {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = year === currentYear ? referenceDate : new Date(year, 11, 31);

        // Use REVENUE_STATUS_IDS for consistency with YTD calculations
        const revenue = await storage.getRevenueForDateRange(
          formatDate(yearStart),
          formatDate(yearEnd),
          REVENUE_STATUS_IDS
        );

        return { year, revenue };
      })
    );

    // Calculate growth rates
    const growthData = yearlyData.map((data, index) => {
      let growth = null;
      if (index > 0 && yearlyData[index - 1].revenue > 0) {
        growth = ((data.revenue - yearlyData[index - 1].revenue) / yearlyData[index - 1].revenue) * 100;
      }

      return {
        year: data.year,
        revenue: data.revenue,
        growth,
        isYTD: data.year === currentYear,
      };
    });

    return growthData;
  }

  async getChannelPerformanceOverTime(years: number[]) {
    const channels = ['B2B', 'B2C', 'WEBSHOP', 'BOEREN_EN_BUREN'] as const;

    const channelData = await Promise.all(
      channels.map(async (channel) => {
        const yearRevenues = await Promise.all(
          years.map(async (year) => {
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31);

            // Use REVENUE_STATUS_IDS for consistency with YTD calculations
            const revenue = await storage.getRevenueForChannel(
              formatDate(yearStart),
              formatDate(yearEnd),
              channel,
              REVENUE_STATUS_IDS
            );

            return { year, revenue };
          })
        );

        const result: any = {
          channel,
        };

        yearRevenues.forEach(({ year, revenue }) => {
          result[`year_${year}`] = revenue;
        });

        // Calculate growth (current year vs previous year if available)
        if (yearRevenues.length >= 2) {
          const current = yearRevenues[yearRevenues.length - 1].revenue;
          const previous = yearRevenues[yearRevenues.length - 2].revenue;
          result.growth = previous > 0 ? ((current - previous) / previous) * 100 : null;
        } else {
          result.growth = null;
        }

        return result;
      })
    );

    return channelData;
  }

  // Inventory Dashboard Methods
  async getStockMovementSummary(days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all product types (categories)
    const productTypes = await storage.getProductTypes();

    const categoryData = await Promise.all(
      productTypes.map(async (type) => {
        // This would need a storage method to get stock movements by category
        // For now, return placeholder structure
        return {
          categoryId: type.id,
          categoryName: type.name,
          stockIn: 0,
          stockOut: 0,
          netChange: 0,
        };
      })
    );

    return categoryData;
  }

  async getInventoryLevels() {
    return await storage.getAllInventoryLevels(50, 6); // Get top 50 products, 6-month average
  }

  async getRecentStockMovements(limit = 20) {
    // This would need a storage method to get recent stock movements
    // Placeholder for now
    return [];
  }
}

export const dashboardService = new DashboardService();
