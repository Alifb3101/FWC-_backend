import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CelebrityService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const looks = await this.prisma.celebrityLook.findMany({
      where: {
        isActive: true,
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        brandId: true,
        slug: true,
        imageUrl: true,
        brand: {
          select: {
            name: true,
            slug: true,
          },
        },
        products: {
          orderBy: { sortOrder: 'asc' },
          where: {
            product: {
              isActive: true,
              publishedAt: {
                not: null,
                lte: new Date(),
              },
            },
          },
          select: {
            product: {
              select: {
                id: true,
                slug: true,
                thumbnail: true,
                price: true,
                currency: true,
                brand: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
          take: 3,
        },
      },
    });

    const fallbackBrandIds = Array.from(
      new Set(
        looks
          .filter((look) => look.products.length === 0 && look.brandId !== null)
          .map((look) => look.brandId as number),
      ),
    );

    const fallbackProducts = fallbackBrandIds.length
      ? await this.prisma.product.findMany({
          where: {
            brandId: {
              in: fallbackBrandIds,
            },
            isActive: true,
            publishedAt: {
              not: null,
              lte: new Date(),
            },
          },
          orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            slug: true,
            thumbnail: true,
            price: true,
            currency: true,
            brandId: true,
            brand: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        })
      : [];

    const fallbackProductsByBrand = new Map<
      number,
      Array<{
        id: number;
        slug: string;
        thumbnail: string | null;
        price: number;
        currency: string;
        brand: { name: string; slug: string };
      }>
    >();

    for (const product of fallbackProducts) {
      const existing = fallbackProductsByBrand.get(product.brandId) ?? [];

      if (existing.length >= 3) {
        continue;
      }

      existing.push({
        id: product.id,
        slug: product.slug,
        thumbnail: product.thumbnail,
        price: Number(product.price.toNumber().toFixed(2)),
        currency: product.currency,
        brand: product.brand,
      });

      fallbackProductsByBrand.set(product.brandId, existing);
    }

    return looks
      .map((look) => {
        const linkedProducts = look.products.map((entry) => ({
          id: entry.product.id,
          slug: entry.product.slug,
          thumbnail: entry.product.thumbnail,
          price: Number(entry.product.price.toNumber().toFixed(2)),
          currency: entry.product.currency,
          brand: entry.product.brand,
        }));

        const products =
          linkedProducts.length > 0
            ? linkedProducts
            : look.brandId !== null
              ? (fallbackProductsByBrand.get(look.brandId) ?? [])
              : [];

        const resolvedBrand = look.brand ?? products[0]?.brand;

        if (products.length === 0 || !resolvedBrand) {
          return null;
        }

        return {
          id: look.id,
          slug: look.slug,
          image: look.imageUrl,
          brand: {
            name: resolvedBrand.name,
            slug: resolvedBrand.slug,
          },
          products: products.map((product) => ({
            id: product.id,
            slug: product.slug,
            thumbnail: product.thumbnail,
            price: product.price,
            currency: product.currency,
          })),
        };
      })
      .filter((look): look is NonNullable<typeof look> => look !== null);
  }

  async findBySlug(slug: string) {
    const look = await this.prisma.celebrityLook.findFirst({
      where: {
        slug,
        isActive: true,
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        title: true,
        description: true,
        imageUrl: true,
        publishedAt: true,
        products: {
          orderBy: { sortOrder: 'asc' },
          select: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                originalPrice: true,
                thumbnail: true,
                ratingAverage: true,
                ratingCount: true,
                currency: true,
                stock: true,
                brand: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!look) {
      throw new NotFoundException('Celebrity look not found');
    }

    return {
      ...look,
      products: look.products.map((entry) => {
        const price = Number(entry.product.price.toNumber().toFixed(2));
        const comparePrice = entry.product.originalPrice
          ? Number(entry.product.originalPrice.toNumber().toFixed(2))
          : null;

        return {
          id: entry.product.id,
          name: entry.product.name,
          slug: entry.product.slug,
          price,
          comparePrice,
          discountPercent:
            comparePrice && comparePrice > price
              ? Math.round(((comparePrice - price) / comparePrice) * 100)
              : 0,
          thumbnail: entry.product.thumbnail,
          rating: Number(entry.product.ratingAverage.toFixed(1)),
          reviewCount: entry.product.ratingCount,
          currency: entry.product.currency,
          inStock: entry.product.stock > 0,
          badge: 'Celebrity',
          brand: entry.product.brand,
        };
      }),
    };
  }
}
