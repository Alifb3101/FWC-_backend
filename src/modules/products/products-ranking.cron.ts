import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductsService } from './products.service';

@Injectable()
export class ProductsRankingCron {
  private readonly logger = new Logger(ProductsRankingCron.name);

  constructor(private readonly productsService: ProductsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyRankingRefresh(): Promise<void> {
    try {
      const updatedCount = await this.productsService.recalculateBestSellerScores();
      this.logger.log(
        `Best seller scores recalculated successfully. Updated products: ${updatedCount}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to recalculate best seller scores: ${message}`);
    }
  }
}
