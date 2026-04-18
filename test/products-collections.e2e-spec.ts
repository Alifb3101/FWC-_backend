import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products collections (e2e)', () => {
  let app: INestApplication<App>;

  const prismaMock = {
    $transaction: jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const cacheMock = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const decimal = (value: number): Prisma.Decimal => new Prisma.Decimal(value);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(CACHE_MANAGER)
      .useValue(cacheMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cacheMock.get.mockResolvedValue(undefined);
    cacheMock.set.mockResolvedValue(undefined);
    cacheMock.del.mockResolvedValue(undefined);
    prismaMock.product.count.mockResolvedValue(0);
    prismaMock.product.findMany.mockResolvedValue([]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/products/best-sellers uses fallback sorting and default limit', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Top Product',
        slug: 'top-product',
        thumbnail: 'https://img/top.jpg',
        price: decimal(100),
        originalPrice: decimal(120),
        currency: 'AED',
        ratingAverage: 4.5,
        ratingCount: 20,
        stock: 10,
        brand: {
          name: 'Seiko',
          slug: 'seiko',
        },
      },
    ]);
    prismaMock.product.count.mockResolvedValue(1);

    await request(app.getHttpServer())
      .get('/api/products/best-sellers')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          success: true,
          data: {
            items: [
              {
                id: 1,
                name: 'Top Product',
                slug: 'top-product',
                thumbnail: 'https://img/top.jpg',
                price: 100,
                comparePrice: 120,
                discountPercent: 17,
                rating: 4.5,
                reviewCount: 20,
                currency: 'AED',
                inStock: true,
                badge: 'Best Seller',
                brand: {
                  name: 'Seiko',
                  slug: 'seiko',
                },
              },
            ],
            pagination: {
              page: 1,
              limit: 8,
              total: 1,
              totalPages: 1,
            },
          },
        });
      });

    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 8,
        orderBy: [
          { isBestSeller: 'desc' },
          { bestSellerScore: 'desc' },
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        where: expect.objectContaining({
          isActive: true,
          stock: { gt: 0 },
          publishedAt: expect.objectContaining({
            not: null,
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it('GET /api/products/new-arrivals applies visibility filters and sorting', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 7,
        name: 'New Product',
        slug: 'new-product',
        thumbnail: null,
        price: decimal(80),
        originalPrice: null,
        currency: 'AED',
        ratingAverage: 0,
        ratingCount: 0,
        stock: 3,
        brand: {
          name: 'Casio',
          slug: 'casio',
        },
      },
    ]);
    prismaMock.product.count.mockResolvedValue(1);

    await request(app.getHttpServer())
      .get('/api/products/new-arrivals?limit=6')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          success: true,
          data: {
            items: [
              {
                id: 7,
                name: 'New Product',
                slug: 'new-product',
                thumbnail: null,
                price: 80,
                comparePrice: null,
                discountPercent: 0,
                rating: 0,
                reviewCount: 0,
                currency: 'AED',
                inStock: true,
                badge: 'New Arrival',
                brand: {
                  name: 'Casio',
                  slug: 'casio',
                },
              },
            ],
            pagination: {
              page: 1,
              limit: 6,
              total: 1,
              totalPages: 1,
            },
          },
        });
      });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 6,
        orderBy: [{ isNewArrival: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        where: expect.objectContaining({
          isActive: true,
          stock: { gt: 0 },
          publishedAt: expect.objectContaining({
            not: null,
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it('GET /api/products/new-arrivals can include out-of-stock when requested', async () => {
    await request(app.getHttpServer())
      .get('/api/products/new-arrivals?includeOutOfStock=true')
      .expect(200)
      .expect({
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 8,
            total: 0,
            totalPages: 1,
          },
        },
      });

    const queryArg = prismaMock.product.findMany.mock.calls[0][0] as {
      where: Record<string, unknown>;
    };

    expect(queryArg.where).toEqual(
      expect.objectContaining({
        isActive: true,
        publishedAt: expect.objectContaining({
          not: null,
          lte: expect.any(Date),
        }),
      }),
    );
    expect(queryArg.where.stock).toBeUndefined();
  });

  it('returns empty list for empty state on best-sellers and new-arrivals', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/api/products/best-sellers')
      .expect(200)
      .expect({
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 8,
            total: 0,
            totalPages: 1,
          },
        },
      });

    await request(app.getHttpServer())
      .get('/api/products/new-arrivals')
      .expect(200)
      .expect({
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 8,
            total: 0,
            totalPages: 1,
          },
        },
      });
  });

  it('validates limit max=24 for best-sellers and new-arrivals', async () => {
    await request(app.getHttpServer()).get('/api/products/best-sellers?limit=25').expect(400);
    await request(app.getHttpServer()).get('/api/products/new-arrivals?limit=999').expect(400);
  });

  it('validates limit min=1', async () => {
    await request(app.getHttpServer()).get('/api/products/best-sellers?limit=0').expect(400);
  });

  it('ensures hidden and effectively deleted products are excluded by query filter', async () => {
    await request(app.getHttpServer()).get('/api/products/best-sellers').expect(200);

    const queryArg = prismaMock.product.findMany.mock.calls[0][0] as {
      where: Record<string, unknown>;
    };

    expect(queryArg.where).toEqual(
      expect.objectContaining({
        isActive: true,
        publishedAt: expect.objectContaining({
          not: null,
          lte: expect.any(Date),
        }),
      }),
    );

    // No soft-delete column exists in current schema; hard-deleted rows are naturally absent.
    expect(queryArg.where.stock).toEqual({ gt: 0 });
  });
});
