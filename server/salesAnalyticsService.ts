/**
 * Sales Analytics Service Layer
 *
 * Handles Phase 3 analytics business logic and aggregates.
 */
import { storage } from "./storage";

const INVOICED_STATUS_ID = 3;
const PAID_STATUS_ID = 4;
const REVENUE_STATUS_IDS = [INVOICED_STATUS_ID, PAID_STATUS_ID];

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

const isYearComplete = (date: Date): boolean => {
  return date.getMonth() === 11 && date.getDate() === 31;
};

export type MonthlyComparisonRow = {
  month: string;
  monthNumber: number;
  [year: string]: number | string;
};

export type MonthlyComparisonResponse = {
  months: MonthlyComparisonRow[];
  totals: Record<string, number>;
};

export type LifetimeStatsResponse = {
  totalAllTime: number;
  bestMonth: { month: string; year: number; revenue: number } | null;
  annualGrowth: Array<{
    year: number;
    revenue: number;
    growthPercentage: number | null;
    ytd?: boolean;
  }>;
  cumulativeRevenue: Array<{
    month: string;
    revenue: number;
    cumulative: number;
  }>;
};

export type ChannelTrendsResponse = {
  currentYear: number;
  previousYear: number;
  channels: Array<{
    channel: string;
    revenues: Record<string, number>;
    growthRate: number | null;
  }>;
};

export class SalesAnalyticsService {
  async getMonthlyComparison(years: number[], referenceDate = new Date()): Promise<MonthlyComparisonResponse> {
    const monthlyRows = await storage.getMonthlyRevenueByYears(years, REVENUE_STATUS_IDS);
    const revenueLookup = new Map<string, number>();

    monthlyRows.forEach((row) => {
      revenueLookup.set(`${row.year}-${row.month}`, row.revenue);
    });

    const totals: Record<string, number> = {};
    years.forEach((year) => {
      totals[String(year)] = 0;
    });

    const months = monthLabels.map((label, index) => {
      const row: MonthlyComparisonRow = {
        month: label,
        monthNumber: index + 1,
      };

      years.forEach((year) => {
        const value = revenueLookup.get(`${year}-${index + 1}`) ?? 0;
        row[String(year)] = value;
        totals[String(year)] += value;
      });

      return row;
    });

    return {
      months,
      totals,
    };
  }

  async getLifetimeStats(referenceDate = new Date()): Promise<LifetimeStatsResponse> {
    const currentYear = referenceDate.getFullYear();
    const previousYear = currentYear - 1;

    const currentYearStart = new Date(currentYear, 0, 1);
    const previousYearStart = new Date(previousYear, 0, 1);
    const previousYearSameDate = clampDay(previousYear, referenceDate.getMonth(), referenceDate.getDate());

    const [
      totalAllTime,
      bestMonth,
      annualRevenue,
      monthlyTimeline,
      currentYearRevenue,
      previousYearYtdRevenue,
    ] = await Promise.all([
      storage.getAllTimeRevenue(REVENUE_STATUS_IDS),
      storage.getBestRevenueMonth(REVENUE_STATUS_IDS),
      storage.getAnnualRevenue(REVENUE_STATUS_IDS),
      storage.getMonthlyRevenueTimeline(REVENUE_STATUS_IDS),
      storage.getRevenueForDateRange(formatDate(currentYearStart), formatDate(referenceDate), REVENUE_STATUS_IDS),
      storage.getRevenueForDateRange(formatDate(previousYearStart), formatDate(previousYearSameDate), REVENUE_STATUS_IDS),
    ]);

    const annualGrowth = annualRevenue.map((entry, index) => {
      const isCurrentYear = entry.year === currentYear;
      const revenue = isCurrentYear ? currentYearRevenue : entry.revenue;
      const ytd = isCurrentYear && !isYearComplete(referenceDate);
      let growthPercentage: number | null = null;

      if (index > 0) {
        const previousEntry = annualRevenue[index - 1];
        const previousRevenue = isCurrentYear ? previousYearYtdRevenue : previousEntry.revenue;
        if (previousRevenue > 0) {
          growthPercentage = ((revenue - previousRevenue) / previousRevenue) * 100;
        }
      }

      return {
        year: entry.year,
        revenue,
        growthPercentage,
        ...(ytd ? { ytd: true } : {}),
      };
    });

    let cumulativeTotal = 0;
    const cumulativeRevenue = monthlyTimeline.map((entry) => {
      cumulativeTotal += entry.revenue;
      return {
        month: entry.monthKey,
        revenue: entry.revenue,
        cumulative: cumulativeTotal,
      };
    });

    return {
      totalAllTime,
      bestMonth: bestMonth
        ? {
            month: monthLabels[bestMonth.month - 1] ?? "Unknown",
            year: bestMonth.year,
            revenue: bestMonth.revenue,
          }
        : null,
      annualGrowth,
      cumulativeRevenue,
    };
  }

  async getChannelTrends(years: number[], referenceDate = new Date()): Promise<ChannelTrendsResponse> {
    const currentYear = referenceDate.getFullYear();
    const previousYear = currentYear - 1;

    const currentYearStart = new Date(currentYear, 0, 1);
    const previousYearStart = new Date(previousYear, 0, 1);
    const previousYearSameDate = clampDay(previousYear, referenceDate.getMonth(), referenceDate.getDate());

    const [channelRevenueByYears, currentYtdByChannel, previousYtdByChannel] = await Promise.all([
      storage.getChannelRevenueByYears(years, REVENUE_STATUS_IDS, referenceDate),
      storage.getChannelRevenueForDateRange(
        formatDate(currentYearStart),
        formatDate(referenceDate),
        REVENUE_STATUS_IDS
      ),
      storage.getChannelRevenueForDateRange(
        formatDate(previousYearStart),
        formatDate(previousYearSameDate),
        REVENUE_STATUS_IDS
      ),
    ]);

    const channels = ["B2B", "B2C", "WEBSHOP", "BOEREN_EN_BUREN"];
    const channelMap = new Map<string, Record<string, number>>();
    channels.forEach((channel) => {
      channelMap.set(channel, {});
    });

    channelRevenueByYears.forEach((entry) => {
      const channelEntry = channelMap.get(entry.channel) ?? {};
      channelEntry[String(entry.year)] = entry.revenue;
      channelMap.set(entry.channel, channelEntry);
    });

    const currentYtdMap = new Map(currentYtdByChannel.map((entry) => [entry.channel, entry.revenue]));
    const previousYtdMap = new Map(previousYtdByChannel.map((entry) => [entry.channel, entry.revenue]));

    const channelRows = channels.map((channel) => {
      const revenues = channelMap.get(channel) ?? {};
      years.forEach((year) => {
        if (revenues[String(year)] === undefined) {
          revenues[String(year)] = 0;
        }
      });

      const currentYtd = currentYtdMap.get(channel) ?? 0;
      const previousYtd = previousYtdMap.get(channel) ?? 0;
      const growthRate = previousYtd > 0 ? ((currentYtd - previousYtd) / previousYtd) * 100 : null;

      return {
        channel,
        revenues,
        growthRate,
      };
    });

    return {
      currentYear,
      previousYear,
      channels: channelRows,
    };
  }
}

export const salesAnalyticsService = new SalesAnalyticsService();
