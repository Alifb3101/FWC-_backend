import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { ProductsController } from './products.controller';
import { ProductsRankingCron } from './products-ranking.cron';
import { ProductsService } from './products.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300,
      max: 256,
    }),
    MediaModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRankingCron],
  exports: [ProductsService],
})
export class ProductsModule {}
