import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService, TopCustomer, WeeklyRevenueBar, DashboardSummary } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

/**
 * Controller exposing endpoints for real-time merchant analytics,
 * summary metrics, top customer list, and weekly revenue graph stats.
 */
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * Retrieves high-level merchant metrics summary (today revenue, count, yesterday revenue, average ticket size).
   *
   * @route GET /dashboard/summary
   * @security JWT Auth
   * @param {{id: string}} merchant Current authenticated merchant profile.
   * @returns {Promise<DashboardSummary>} High-level dashboard summary.
   */
  @Get('summary')
  async getSummary(
    @CurrentMerchant() merchant: { id: string },
  ): Promise<DashboardSummary> {
    return this.dashboardService.getSummary(merchant.id);
  }

  /**
   * Retrieves list of top 5 customers who spent the most with the merchant.
   *
   * @route GET /dashboard/top-customers
   * @security JWT Auth
   * @param {{id: string}} merchant Current authenticated merchant profile.
   * @returns {Promise<TopCustomer[]>} Sorted top spending customer list.
   */
  @Get('top-customers')
  async getTopCustomers(
    @CurrentMerchant() merchant: { id: string },
  ): Promise<TopCustomer[]> {
    return this.dashboardService.getTopCustomers(merchant.id);
  }

  /**
   * Retrieves a weekly revenue breakdown for the rolling last 7 days.
   *
   * @route GET /dashboard/weekly-revenue
   * @security JWT Auth
   * @param {{id: string}} merchant Current authenticated merchant profile.
   * @returns {Promise<WeeklyRevenueBar[]>} Rolling week revenue series.
   */
  @Get('weekly-revenue')
  async getWeeklyRevenue(
    @CurrentMerchant() merchant: { id: string },
  ): Promise<WeeklyRevenueBar[]> {
    return this.dashboardService.getWeeklyRevenue(merchant.id);
  }
}
