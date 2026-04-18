import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductCollectionDto } from './dto/query-product-collection.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const DEFAULT_PRODUCT_IMAGE_URL =
  'https://www.monawatch.com/cdn/shop/files/SBTR029-700x700.webp?v=1747428186&width=620';

const productListSelect = Prisma.validator<Prisma.ProductSelect>()({
  id: true,
  name: true,
  slug: true,
  sku: true,
  modelNumber: true,
  shortDescription: true,
  description: true,
  price: true,
  originalPrice: true,
  currency: true,
  stock: true,
  thumbnail: true,
  tags: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  images: {
    orderBy: { sortOrder: 'asc' },
    select: {
      url: true,
      sortOrder: true,
    },
  },
  brand: {
    select: {
      name: true,
      slug: true,
    },
  },
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
  variants: {
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      color: true,
      size: true,
      strap: true,
      dial: true,
      stock: true,
      price: true,
      priceDifference: true,
    },
  },
});

type ProductListRecord = Prisma.ProductGetPayload<{ select: typeof productListSelect }>;
const productCollectionSelect = Prisma.validator<Prisma.ProductSelect>()({
  id: true,
  name: true,
  slug: true,
  thumbnail: true,
  price: true,
  originalPrice: true,
  currency: true,
  ratingAverage: true,
  ratingCount: true,
  stock: true,
  brand: {
    select: {
      name: true,
      slug: true,
    },
  },
});

type ProductCollectionRecord = Prisma.ProductGetPayload<{ select: typeof productCollectionSelect }>;
type ReviewMetricRecord = {
  productId: number;
  rating: number;
  reviewCount: number;
};

type ProductCollectionBadge = 'Best Seller' | 'New Arrival';

type ProductCollectionItem = {
  id: number;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  comparePrice: number | null;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  currency: string;
  inStock: boolean;
  badge: ProductCollectionBadge;
  brand: {
    name: string;
    slug: string;
  };
};

type ProductCollectionPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ProductCollectionListResult = {
  items: ProductCollectionItem[];
  pagination: ProductCollectionPagination;
};

type ProductResponseItem = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  modelNumber: string;
  shortDescription: string | null;
  description: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  currency: string;
  stock: number;
  availability: 'out_of_stock' | 'low_stock' | 'in_stock';
  thumbnail: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
  tags: string[];
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  seoTitle: string | null;
  seoDescription: string | null;
  watchDescription: string;
  specifications: {
    reference: string;
    caliber: string;
    collection: string;
    movement: string;
    caseSize: string;
    thickness: string;
    dialColor: string;
    caseMaterial: string;
    crystal: string;
    lugWidth: string;
    status: string;
    waterResistance: string;
    antiReflection: string;
  };
  strap: {
    strapReference: string;
    strapType: string;
    buckleType: string;
    buckleWidth: string;
    easyClick: string;
  };
  variants: Array<{
    id: number;
    name: string;
    color: string | null;
    size: string | null;
    strap: string | null;
    dial: string | null;
    stock: number;
    price: number;
    priceDifference: number | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(query: QueryProductsDto): Promise<{
    items: ProductResponseItem[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page;
    const limit = query.limit;
    const tags = query.tags
      ?.split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      publishedAt: {
        not: null,
        lte: new Date(),
      },
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                sku: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.brand
        ? {
            brand: {
              slug: query.brand,
              isActive: true,
            },
          }
        : {}),
      ...(query.category
        ? {
            category: {
              slug: query.category,
              isActive: true,
            },
          }
        : {}),
      ...(query.collection
        ? {
            category: {
              slug: query.collection,
              isActive: true,
            },
          }
        : {}),
      ...(tags?.length
        ? {
            tags: {
              hasSome: tags,
            },
          }
        : {}),
    };

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: productListSelect,
      }),
    ]);

    const reviewMetrics = await this.getReviewMetrics(products.map((product) => product.id));

    return {
      items: products.map((product) => this.mapProduct(product, reviewMetrics.get(product.id))),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findFeatured(): Promise<ProductResponseItem[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
      select: productListSelect,
    });

    const reviewMetrics = await this.getReviewMetrics(products.map((product) => product.id));
    return products.map((product) => this.mapProduct(product, reviewMetrics.get(product.id)));
  }

  async findBySlug(slug: string): Promise<ProductResponseItem> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      },
      select: productListSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviewMetric = await this.getReviewMetric(product.id);
    return this.mapProduct(product, reviewMetric);
  }

  async create(createProductDto: CreateProductDto): Promise<ProductResponseItem> {
    if (
      createProductDto.originalPrice !== undefined &&
      createProductDto.originalPrice < createProductDto.price
    ) {
      throw new BadRequestException('originalPrice must be greater than or equal to price');
    }

    await this.assertProductUniqueness(createProductDto.slug, createProductDto.sku);
    await this.assertReferencesExist(createProductDto.brandId, createProductDto.categoryId);
    const imagesToSave = this.withDefaultImage(createProductDto.images);

    const created = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        slug: createProductDto.slug,
        sku: createProductDto.sku,
        modelNumber: createProductDto.modelNumber,
        shortDescription: createProductDto.shortDescription ?? null,
        description: createProductDto.description,
        brandId: createProductDto.brandId,
        categoryId: createProductDto.categoryId,
        price: createProductDto.price,
        originalPrice: createProductDto.originalPrice ?? null,
        currency: createProductDto.currency ?? 'AED',
        stock: createProductDto.stock,
        isBestSeller: createProductDto.isBestSeller ?? false,
        isNewArrival: createProductDto.isNewArrival ?? false,
        bestSellerScore: createProductDto.bestSellerScore ?? 0,
        isFeatured: createProductDto.isFeatured ?? false,
        isActive: createProductDto.isActive ?? true,
        publishedAt: createProductDto.publishedAt ?? null,
        thumbnail: createProductDto.thumbnail ?? DEFAULT_PRODUCT_IMAGE_URL,
        tags: createProductDto.tags ?? [],
        seoTitle: createProductDto.seoTitle ?? null,
        seoDescription: createProductDto.seoDescription ?? null,
        images: imagesToSave.length
          ? {
              createMany: {
                data: imagesToSave.map((image, index) => ({
                  url: image.url,
                  sortOrder: image.sortOrder ?? index,
                })),
              },
            }
          : undefined,
        variants: createProductDto.variants?.length
          ? {
              createMany: {
                data: createProductDto.variants.map((variant) => ({
                  name: variant.name,
                  color: variant.color,
                  size: variant.size,
                  strap: variant.strap,
                  dial: variant.dial,
                  stock: variant.stock,
                  price: variant.price,
                  priceDifference: variant.priceDifference,
                })),
              },
            }
          : undefined,
      },
      select: productListSelect,
    });

    await this.clearHomeCollectionsCache();
    return this.mapProduct(created);
  }

  async findBestSellers(query: QueryProductCollectionDto): Promise<ProductCollectionListResult> {
    return this.getCollectionProducts('best-sellers', query, 'Best Seller');
  }

  async findNewArrivals(query: QueryProductCollectionDto): Promise<ProductCollectionListResult> {
    return this.getCollectionProducts('new-arrivals', query, 'New Arrival');
  }

  async getBestSellerPreview(limit = 8): Promise<ProductCollectionItem[]> {
    const result = await this.getCollectionProducts(
      'best-sellers',
      { page: 1, limit, includeOutOfStock: false },
      'Best Seller',
    );

    return result.items;
  }

  async getNewArrivalPreview(limit = 8): Promise<ProductCollectionItem[]> {
    const result = await this.getCollectionProducts(
      'new-arrivals',
      { page: 1, limit, includeOutOfStock: false },
      'New Arrival',
    );

    return result.items;
  }

  async getProductsByCollection(
    collectionSlug: string,
    page: number,
    limit: number,
  ): Promise<ProductCollectionListResult> {
    const where: Prisma.ProductWhereInput = {
      ...this.buildPublishedProductWhere(false),
      category: {
        slug: collectionSlug,
        isActive: true,
      },
    };

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: productCollectionSelect,
      }),
    ]);

    return {
      items: products.map((product) => this.mapCollectionProduct(product, 'New Arrival')),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  calculateBestSellerScore(metrics: {
    soldCount: number;
    wishlistCount: number;
    viewsCount: number;
    ratingAverage: number;
  }): number {
    return Math.round(
      metrics.soldCount * 50 +
        metrics.wishlistCount * 10 +
        metrics.viewsCount * 2 +
        metrics.ratingAverage * 20,
    );
  }

  async recalculateBestSellerScores(): Promise<number> {
    const updatedCount = await this.prisma.$executeRaw`
      UPDATE "Product"
      SET "bestSellerScore" = ROUND(("soldCount" * 50) + ("wishlistCount" * 10) + ("viewsCount" * 2) + ("ratingAverage" * 20))::int
      WHERE "isActive" = true
      AND "publishedAt" IS NOT NULL
      AND "publishedAt" <= NOW()
    `;

    await this.clearHomeCollectionsCache();
    return updatedCount;
  }

  async update(productId: number, updateProductDto: UpdateProductDto): Promise<ProductResponseItem> {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        slug: true,
        sku: true,
        price: true,
        originalPrice: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const effectivePrice = updateProductDto.price ?? existing.price.toNumber();
    const effectiveOriginalPrice =
      updateProductDto.originalPrice ??
      (existing.originalPrice !== null ? existing.originalPrice.toNumber() : undefined);

    if (effectiveOriginalPrice !== undefined && effectiveOriginalPrice < effectivePrice) {
      throw new BadRequestException('originalPrice must be greater than or equal to price');
    }

    if (updateProductDto.slug && updateProductDto.slug !== existing.slug) {
      await this.assertSlugAvailable(updateProductDto.slug);
    }

    if (updateProductDto.sku && updateProductDto.sku !== existing.sku) {
      await this.assertSkuAvailable(updateProductDto.sku);
    }

    if (updateProductDto.brandId !== undefined || updateProductDto.categoryId !== undefined) {
      await this.assertReferencesExist(
        updateProductDto.brandId,
        updateProductDto.categoryId,
        existing.id,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.product.update({
        where: { id: existing.id },
        data: {
          ...(updateProductDto.name !== undefined ? { name: updateProductDto.name } : {}),
          ...(updateProductDto.slug !== undefined ? { slug: updateProductDto.slug } : {}),
          ...(updateProductDto.sku !== undefined ? { sku: updateProductDto.sku } : {}),
          ...(updateProductDto.modelNumber !== undefined
            ? { modelNumber: updateProductDto.modelNumber }
            : {}),
          ...(updateProductDto.shortDescription !== undefined
            ? { shortDescription: updateProductDto.shortDescription }
            : {}),
          ...(updateProductDto.description !== undefined
            ? { description: updateProductDto.description }
            : {}),
          ...(updateProductDto.brandId !== undefined ? { brandId: updateProductDto.brandId } : {}),
          ...(updateProductDto.categoryId !== undefined
            ? { categoryId: updateProductDto.categoryId }
            : {}),
          ...(updateProductDto.price !== undefined ? { price: updateProductDto.price } : {}),
          ...(updateProductDto.originalPrice !== undefined
            ? { originalPrice: updateProductDto.originalPrice }
            : {}),
          ...(updateProductDto.currency !== undefined ? { currency: updateProductDto.currency } : {}),
          ...(updateProductDto.stock !== undefined ? { stock: updateProductDto.stock } : {}),
          ...(updateProductDto.isBestSeller !== undefined
            ? { isBestSeller: updateProductDto.isBestSeller }
            : {}),
          ...(updateProductDto.isNewArrival !== undefined
            ? { isNewArrival: updateProductDto.isNewArrival }
            : {}),
          ...(updateProductDto.bestSellerScore !== undefined
            ? { bestSellerScore: updateProductDto.bestSellerScore }
            : {}),
          ...(updateProductDto.isFeatured !== undefined
            ? { isFeatured: updateProductDto.isFeatured }
            : {}),
          ...(updateProductDto.isActive !== undefined ? { isActive: updateProductDto.isActive } : {}),
          ...(updateProductDto.publishedAt !== undefined
            ? { publishedAt: updateProductDto.publishedAt }
            : {}),
          ...(updateProductDto.thumbnail !== undefined
            ? { thumbnail: updateProductDto.thumbnail }
            : {}),
          ...(updateProductDto.tags !== undefined ? { tags: updateProductDto.tags } : {}),
          ...(updateProductDto.seoTitle !== undefined ? { seoTitle: updateProductDto.seoTitle } : {}),
          ...(updateProductDto.seoDescription !== undefined
            ? { seoDescription: updateProductDto.seoDescription }
            : {}),
        },
      });

      if (updateProductDto.images) {
        await tx.productImage.deleteMany({ where: { productId: existing.id } });

        const imagesToSave = this.withDefaultImage(updateProductDto.images);

        if (imagesToSave.length > 0) {
          await tx.productImage.createMany({
            data: imagesToSave.map((image, index) => ({
              productId: existing.id,
              url: image.url,
              sortOrder: image.sortOrder ?? index,
            })),
          });
        }
      }

      if (updateProductDto.variants) {
        await tx.productVariant.deleteMany({ where: { productId: existing.id } });

        if (updateProductDto.variants.length > 0) {
          await tx.productVariant.createMany({
            data: updateProductDto.variants.map((variant) => ({
              productId: existing.id,
              name: variant.name,
              color: variant.color,
              size: variant.size,
              strap: variant.strap,
              dial: variant.dial,
              stock: variant.stock,
              price: variant.price,
              priceDifference: variant.priceDifference,
            })),
          });
        }
      }

      return saved;
    });

    const product = await this.prisma.product.findUnique({
      where: { id: updated.id },
      select: productListSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.clearHomeCollectionsCache();
    const reviewMetric = await this.getReviewMetric(product.id);
    return this.mapProduct(product, reviewMetric);
  }

  private async getCollectionProducts(
    kind: 'best-sellers' | 'new-arrivals',
    query: Pick<QueryProductCollectionDto, 'page' | 'limit' | 'includeOutOfStock'>,
    badge: ProductCollectionBadge,
  ): Promise<ProductCollectionListResult> {
    const cacheKey = this.getCollectionCacheKey(
      kind,
      query.page,
      query.limit,
      query.includeOutOfStock,
    );
    const cached = await this.readCollectionFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    const where = this.buildPublishedProductWhere(query.includeOutOfStock);
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      kind === 'best-sellers'
        ? [
            { isBestSeller: 'desc' },
            { bestSellerScore: 'desc' },
            { isFeatured: 'desc' },
            { publishedAt: 'desc' },
            { createdAt: 'desc' },
          ]
        : [{ isNewArrival: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: productCollectionSelect,
      }),
    ]);

    const result: ProductCollectionListResult = {
      items: products.map((product) => this.mapCollectionProduct(product, badge)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };

    await this.writeCollectionToCache(cacheKey, result);
    return result;
  }

  private buildPublishedProductWhere(includeOutOfStock: boolean): Prisma.ProductWhereInput {
    return {
      isActive: true,
      publishedAt: {
        not: null,
        lte: new Date(),
      },
      ...(includeOutOfStock ? {} : { stock: { gt: 0 } }),
    };
  }

  private mapCollectionProduct(
    product: ProductCollectionRecord,
    badge: ProductCollectionBadge,
  ): ProductCollectionItem {
    const price = this.decimalToNumber(product.price) ?? 0;
    const comparePrice = this.decimalToNumber(product.originalPrice);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      thumbnail: product.thumbnail,
      price,
      comparePrice,
      discountPercent: this.calculateDiscountPercent(price, comparePrice),
      rating: Number(product.ratingAverage.toFixed(1)),
      reviewCount: product.ratingCount,
      currency: product.currency,
      inStock: product.stock > 0,
      badge,
      brand: {
        name: product.brand.name,
        slug: product.brand.slug,
      },
    };
  }

  private getCollectionCacheKey(
    kind: 'best-sellers' | 'new-arrivals',
    page: number,
    limit: number,
    includeOutOfStock: boolean,
  ): string {
    return `products:${kind}:page:${page}:limit:${limit}:inStock:${includeOutOfStock ? 'all' : 'only'}`;
  }

  private async readCollectionFromCache(
    key: string,
  ): Promise<ProductCollectionListResult | undefined> {
    try {
      return await this.cacheManager.get<ProductCollectionListResult>(key);
    } catch {
      return undefined;
    }
  }

  private async writeCollectionToCache(
    key: string,
    value: ProductCollectionListResult,
  ): Promise<void> {
    try {
      await this.cacheManager.set(key, value, 300);
    } catch {
      return;
    }
  }

  private async clearHomeCollectionsCache(): Promise<void> {
    const keys: string[] = [];

    for (let page = 1; page <= 10; page += 1) {
      for (let limit = 1; limit <= 24; limit += 1) {
        keys.push(this.getCollectionCacheKey('best-sellers', page, limit, false));
        keys.push(this.getCollectionCacheKey('best-sellers', page, limit, true));
        keys.push(this.getCollectionCacheKey('new-arrivals', page, limit, false));
        keys.push(this.getCollectionCacheKey('new-arrivals', page, limit, true));
      }
    }

    await Promise.allSettled(keys.map((key) => this.cacheManager.del(key)));
  }

  private async assertProductUniqueness(slug: string, sku: string): Promise<void> {
    await Promise.all([this.assertSlugAvailable(slug), this.assertSkuAvailable(sku)]);
  }

  private async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Slug must be unique');
    }
  }

  private async assertSkuAvailable(sku: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({
      where: { sku },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('SKU must be unique');
    }
  }

  private async assertReferencesExist(
    brandId?: number,
    categoryId?: number,
    existingProductId?: number,
  ): Promise<void> {
    const resolvedBrandId =
      brandId ??
      (existingProductId
        ? (
            await this.prisma.product.findUnique({
              where: { id: existingProductId },
              select: { brandId: true },
            })
          )?.brandId
        : undefined);

    const resolvedCategoryId =
      categoryId ??
      (existingProductId
        ? (
            await this.prisma.product.findUnique({
              where: { id: existingProductId },
              select: { categoryId: true },
            })
          )?.categoryId
        : undefined);

    const [brandExists, categoryExists] = await Promise.all([
      resolvedBrandId
        ? this.prisma.brand.findFirst({
            where: { id: resolvedBrandId, isActive: true },
            select: { id: true },
          })
        : null,
      resolvedCategoryId
        ? this.prisma.category.findFirst({
            where: { id: resolvedCategoryId, isActive: true },
            select: { id: true },
          })
        : null,
    ]);

    if (resolvedBrandId && !brandExists) {
      throw new BadRequestException('Brand does not exist or is inactive');
    }

    if (resolvedCategoryId && !categoryExists) {
      throw new BadRequestException('Category does not exist or is inactive');
    }
  }

  private async getReviewMetrics(productIds: number[]): Promise<Map<number, ReviewMetricRecord>> {
    if (productIds.length === 0) {
      return new Map<number, ReviewMetricRecord>();
    }

    const grouped = await this.prisma.review.groupBy({
      by: ['productId'],
      where: {
        productId: {
          in: productIds,
        },
      },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return new Map<number, ReviewMetricRecord>(
      grouped.map((entry) => [
        entry.productId,
        {
          productId: entry.productId,
          rating: Number((entry._avg.rating ?? 0).toFixed(1)),
          reviewCount: entry._count._all,
        },
      ]),
    );
  }

  private async getReviewMetric(productId: number): Promise<ReviewMetricRecord | undefined> {
    const metric = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    if (metric._count._all === 0) {
      return undefined;
    }

    return {
      productId,
      rating: Number((metric._avg.rating ?? 0).toFixed(1)),
      reviewCount: metric._count._all,
    };
  }

  private mapProduct(
    product: ProductListRecord,
    reviewMetric?: ReviewMetricRecord,
  ): ProductResponseItem {
    const price = this.decimalToNumber(product.price) ?? 0;
    const originalPrice = this.decimalToNumber(product.originalPrice);
    const images = this.ensureDefaultImageOnOutput(product.images.map((image) => image.url));

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      modelNumber: product.modelNumber,
      shortDescription: product.shortDescription,
      description: product.description,
      price,
      originalPrice,
      discountPercent: this.calculateDiscountPercent(price, originalPrice),
      currency: product.currency,
      stock: product.stock,
      availability: this.resolveAvailability(product.stock),
      thumbnail: product.thumbnail ?? images[0] ?? DEFAULT_PRODUCT_IMAGE_URL,
      images,
      rating: reviewMetric?.rating ?? 0,
      reviewCount: reviewMetric?.reviewCount ?? 0,
      tags: product.tags,
      brand: {
        name: product.brand.name,
        slug: product.brand.slug,
      },
      category: {
        name: product.category.name,
        slug: product.category.slug,
      },
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      watchDescription: product.description,
      specifications: {
        reference: 'H32461131',
        caliber: 'F06.105',
        collection: 'Jazzmaster',
        movement: 'Quartz',
        caseSize: '40mm',
        thickness: '7.8',
        dialColor: 'Black',
        caseMaterial: 'Stainless steel',
        crystal: 'Sapphire',
        lugWidth: '20mm',
        status: 'Current collection',
        waterResistance: '5 bar (50m)',
        antiReflection: 'Yes',
      },
      strap: {
        strapReference: 'H605000401',
        strapType: 'Stainless steel',
        buckleType: 'Butterfly',
        buckleWidth: '18mm',
        easyClick: 'Yes',
      },
      variants: product.variants.map((variant) => {
        const variantPrice =
          this.decimalToNumber(variant.price) ??
          (this.decimalToNumber(variant.priceDifference) !== null
            ? price + (this.decimalToNumber(variant.priceDifference) ?? 0)
            : price);

        return {
          id: variant.id,
          name: variant.name,
          color: variant.color,
          size: variant.size,
          strap: variant.strap,
          dial: variant.dial,
          stock: variant.stock,
          price: Number(variantPrice.toFixed(2)),
          priceDifference: this.decimalToNumber(variant.priceDifference),
        };
      }),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value.toNumber().toFixed(2));
  }

  private calculateDiscountPercent(price: number, comparePrice: number | null): number {
    if (!comparePrice || comparePrice <= price || comparePrice <= 0) {
      return 0;
    }

    return Math.round(((comparePrice - price) / comparePrice) * 100);
  }

  private withDefaultImage(
    images?: Array<{ url: string; sortOrder?: number }>,
  ): Array<{ url: string; sortOrder?: number }> {
    if (!images || images.length === 0) {
      return [{ url: DEFAULT_PRODUCT_IMAGE_URL, sortOrder: 0 }];
    }

    const normalized = images.map((image, index) => ({
      url: image.url,
      sortOrder: image.sortOrder ?? index,
    }));

    if (!normalized.some((image) => image.url === DEFAULT_PRODUCT_IMAGE_URL)) {
      normalized.unshift({ url: DEFAULT_PRODUCT_IMAGE_URL, sortOrder: 0 });
    }

    return normalized;
  }

  private ensureDefaultImageOnOutput(images: string[]): string[] {
    if (images.includes(DEFAULT_PRODUCT_IMAGE_URL)) {
      return images;
    }

    return [DEFAULT_PRODUCT_IMAGE_URL, ...images];
  }

  private resolveAvailability(stock: number): 'out_of_stock' | 'low_stock' | 'in_stock' {
    if (stock <= 0) {
      return 'out_of_stock';
    }

    if (stock <= 5) {
      return 'low_stock';
    }

    return 'in_stock';
  }
}
