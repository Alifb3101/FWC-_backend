import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { BannersService } from '../banners/banners.service';
import { BrandsService } from '../brands/brands.service';
import { CelebrityService } from '../celebrity/celebrity.service';
import { CollectionsService } from '../collections/collections.service';
import { ProductsService } from '../products/products.service';
import { QueryHomepageDto } from './dto/query-homepage.dto';

@Injectable()
export class HomepageService {
  constructor(
    private readonly bannersService: BannersService,
    private readonly brandsService: BrandsService,
    private readonly productsService: ProductsService,
    private readonly celebrityService: CelebrityService,
    private readonly collectionsService: CollectionsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getHomepage(query: QueryHomepageDto) {
    const cacheKey = `homepage:v1:products:${query.productLimit}:brands:${query.brandsLimit}:banners:${query.bannerLimit}:celeb:${query.celebrityLimit}`;

    try {
      const cached = await this.cacheManager.get<unknown>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {
      // ignore cache errors and continue with DB query
    }

    const [heroBanners, brands, bestSellers, newArrivals, celebrityLooksAll, collectionsPreview] =
      await Promise.all([
        this.bannersService.findHomepageBanners(query.bannerLimit),
        this.brandsService.findActive(query.brandsLimit),
        this.productsService.getBestSellerPreview(query.productLimit),
        this.productsService.getNewArrivalPreview(query.productLimit),
        this.celebrityService.findAll(),
        this.collectionsService.getHomeCollections(4),
      ]);

    const celebrityLooks = celebrityLooksAll.slice(0, query.celebrityLimit);

    const brandNames = brands.slice(0, 5).map((brand) => brand.name);
    const keywordPool = [
      ...brandNames,
      ...bestSellers.slice(0, 3).map((product) => product.name),
      ...newArrivals.slice(0, 3).map((product) => product.name),
    ];

    const seo = {
      title:
        brandNames.length > 0
          ? `${brandNames.join(' | ')} | Watches`
          : 'Watches',
      description: `Discover ${bestSellers.length} best sellers and ${newArrivals.length} new arrivals across men, women, and kids collections.`,
      keywords: keywordPool,
      canonicalUrl: `${process.env.FRONTEND_BASE_URL ?? ''}/`.replace(/\/$/, '/') ,
      ogImage: heroBanners[0]?.imageUrl ?? null,
    };

    const payload = {
      heroBanners,
      brands,
      bestSellers,
      newArrivals,
      celebrityLooks,
      collectionsPreview,
      seo,
    };

    try {
      await this.cacheManager.set(cacheKey, payload, 300);
    } catch {
      // ignore cache errors
    }

    return payload;
  }
}
