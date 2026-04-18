import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { BannersModule } from '../banners/banners.module';
import { BrandsModule } from '../brands/brands.module';
import { CelebrityModule } from '../celebrity/celebrity.module';
import { CollectionsModule } from '../collections/collections.module';
import { ProductsModule } from '../products/products.module';
import { HomepageController } from './homepage.controller';
import { HomepageService } from './homepage.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300,
      max: 128,
    }),
    BannersModule,
    BrandsModule,
    ProductsModule,
    CelebrityModule,
    CollectionsModule,
  ],
  controllers: [HomepageController],
  providers: [HomepageService],
})
export class HomepageModule {}
