import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Interface representing the summary metrics displayed on the dashboard.
 */
export interface DashboardSummary {
  todayRevenue: number;
  todayPaymentCount: number;
  yesterdayRevenue: number; // Used to calculate % change
  pendingAmount: number;
  averagePayment: number;
}

/**
 * Interface representing customer metrics on the dashboard.
 * Aligns with the frontend Customer definition in fixtures.
 */
export interface TopCustomer {
  id: string;
  name: string;
  paymentCount: number;
  totalSpent: number;
}

/**
 * Interface representing weekly revenue per day.
 * Aligns with the frontend WeeklyBar definition in fixtures.
 */
export interface WeeklyRevenueBar {
  day: string;
  amount: number;
}

/**
 * Service calculating dashboard metrics and performance statistics for merchants.
 * Aggregates live transaction database data for current day revenue, yesterday's revenue,
 * customer ranks, and rolling weekly time-series analytics.
 */
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves the high-level dashboard metrics summary for a specific merchant.
   *
   * @param {string} merchantId ID of the query merchant.
   * @returns {Promise<DashboardSummary>} Aggregated summary metrics.
   */
  async getSummary(merchantId: string): Promise<DashboardSummary> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // 1. Today's revenue and payment count
    const todayMetrics = await this.prisma.transaction.aggregate({
      where: {
        merchantId,
        direction: 'incoming',
        status: 'confirmed',
        confirmedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 2. Yesterday's revenue
    const yesterdayMetrics = await this.prisma.transaction.aggregate({
      where: {
        merchantId,
        direction: 'incoming',
        status: 'confirmed',
        confirmedAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
      _sum: { amount: true },
    });

    // 3. Pending incoming volume
    const pendingMetrics = await this.prisma.transaction.aggregate({
      where: {
        merchantId,
        direction: 'incoming',
        status: 'pending',
      },
      _sum: { amount: true },
    });

    // 4. Average ticket size of confirmed incoming transactions
    const averageMetrics = await this.prisma.transaction.aggregate({
      where: {
        merchantId,
        direction: 'incoming',
        status: 'confirmed',
      },
      _avg: { amount: true },
    });

    return {
      todayRevenue: todayMetrics._sum.amount || 0,
      todayPaymentCount: todayMetrics._count.id,
      yesterdayRevenue: yesterdayMetrics._sum.amount || 0,
      pendingAmount: pendingMetrics._sum.amount || 0,
      averagePayment: Math.round(averageMetrics._avg.amount || 0),
    };
  }

  /**
   * Identifies top spending customers based on total successful payments.
   *
   * @param {string} merchantId ID of the query merchant.
   * @returns {Promise<TopCustomer[]>} Sorted list of top customers.
   */
  async getTopCustomers(merchantId: string): Promise<TopCustomer[]> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['senderName'],
      where: {
        merchantId,
        direction: 'incoming',
        status: 'confirmed',
        senderName: { not: null },
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: {
        _sum: { amount: 'desc' },
      },
      take: 5,
    });

    return grouped.map((g, idx) => ({
      id: `c_${idx + 1}`,
      name: g.senderName || 'Anonymous Customer',
      paymentCount: g._count.id,
      totalSpent: g._sum.amount || 0,
    }));
  }

  /**
   * Resolves revenue timeline data for the last 7 days.
   *
   * @param {string} merchantId ID of the query merchant.
   * @returns {Promise<WeeklyRevenueBar[]>} Daily revenue aggregates.
   */
  async getWeeklyRevenue(merchantId: string): Promise<WeeklyRevenueBar[]> {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: WeeklyRevenueBar[] = [];

    // Calculate revenue for each day of the last week (rolling 7 days)
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const dayName = days[targetDate.getDay()];

      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const aggregate = await this.prisma.transaction.aggregate({
        where: {
          merchantId,
          direction: 'incoming',
          status: 'confirmed',
          confirmedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: { amount: true },
      });

      result.push({
        day: dayName,
        amount: aggregate._sum.amount || 0,
      });
    }

    return result;
  }
}
