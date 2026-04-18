import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';

type SeedBrand = {
  name: string;
  slug: string;
  logo: string;
};

type SeedCategory = {
  name: string;
  slug: string;
  parentSlug?: string;
};

type SeedProduct = {
  name: string;
  slug: string;
  sku: string;
  modelNumber?: string;
  shortDescription: string;
  description: string;
  price: string;
  originalPrice: string;
  stock: number;
  isFeatured: boolean;
  brandSlug: string;
  categorySlug: string;
};

type SeedHeroBanner = {
  title: string;
  subtitle?: string;
  imageUrl: string;
  targetUrl?: string;
  sortOrder: number;
};

type SeedCelebrityLook = {
  name: string;
  slug: string;
  title: string;
  description?: string;
  imageUrl: string;
  brandSlug: string;
  productSlugs: string[];
};

const DEFAULT_PRODUCT_IMAGE_URL =
  'https://www.monawatch.com/cdn/shop/files/SBTR029-700x700.webp?v=1747428186&width=620';

const STABLE_PUBLISHED_AT = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run seed');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const brands: SeedBrand[] = [
  { name: 'Seiko', slug: 'seiko', logo: 'https://i.postimg.cc/7PFt7QdW/SEIKO.png' },
  { name: 'Casio', slug: 'casio', logo: 'https://i.postimg.cc/8zXfxxh2/casio.jpg' },
  { name: 'G-shock', slug: 'g-shock', logo: 'https://i.postimg.cc/m2qLQRBT/pngwing-com.png' },
  {
    name: 'NaviForce',
    slug: 'naviforce',
    logo: 'https://i.postimg.cc/Xvcq4hFs/naviforce.avif',
  },
  { name: 'Fossil', slug: 'fossil', logo: 'https://i.postimg.cc/2j4DJvQm/fossile.jpg' },
  { name: 'Al Fajr', slug: 'al-fajr', logo: 'https://i.postimg.cc/qv6QbcKD/al-fajr.png' },
  {
    name: 'Al HArameen',
    slug: 'al-harameen',
    logo: 'https://i.postimg.cc/765ghwNM/al-harameen.png',
  },
  { name: 'Curren', slug: 'curren', logo: 'https://i.postimg.cc/pd17hVK6/curren.webp' },
];

const categories: SeedCategory[] = [
  { name: 'Men', slug: 'men' },
  { name: 'Women', slug: 'women' },
  { name: 'Kids', slug: 'kids' },
  { name: 'Couple', slug: 'couple' },
  { name: 'Classic', slug: 'classic', parentSlug: 'men' },
];

const products: SeedProduct[] = [
  {
    name: 'Seiko Presage Cocktail Time Sky Blue',
    slug: 'seiko-presage-cocktail-time-sky-blue',
    sku: 'SEI-PRE-001',
    shortDescription: 'Automatic dress watch with signature textured sky blue dial.',
    description:
      'A refined Seiko Presage model featuring an in-house automatic movement, polished case finishing, and elegant dauphine hands built for formal and business wear.',
    price: '685.00',
    originalPrice: '749.00',
    stock: 18,
    isFeatured: true,
    brandSlug: 'seiko',
    categorySlug: 'classic',
  },
  {
    name: 'Seiko 5 Sports Field Green',
    slug: 'seiko-5-sports-field-green',
    sku: 'SEI-5SP-002',
    shortDescription: 'Everyday automatic sports watch with military-inspired dial.',
    description:
      'Durable Seiko 5 Sports with 100m water resistance, luminous markers, and robust stainless steel case for daily outdoor and urban use.',
    price: '355.00',
    originalPrice: '399.00',
    stock: 24,
    isFeatured: true,
    brandSlug: 'seiko',
    categorySlug: 'men',
  },
  {
    name: 'Seiko Solar Women Rose Gold',
    slug: 'seiko-solar-women-rose-gold',
    sku: 'SEI-SOL-003',
    shortDescription: 'Elegant women solar watch with rose gold tone bracelet.',
    description:
      'A lightweight and polished solar-powered Seiko for women, combining low-maintenance charging with minimalist luxury styling.',
    price: '279.00',
    originalPrice: '320.00',
    stock: 20,
    isFeatured: false,
    brandSlug: 'seiko',
    categorySlug: 'women',
  },
  {
    name: 'Casio Edifice Chronograph Black Steel',
    slug: 'casio-edifice-chronograph-black-steel',
    sku: 'CAS-EDF-004',
    shortDescription: 'Performance chronograph with racing-inspired aesthetics.',
    description:
      'Casio Edifice with multi-dial chronograph layout, high-contrast black dial, and rugged stainless steel construction for precision timing.',
    price: '229.00',
    originalPrice: '269.00',
    stock: 26,
    isFeatured: true,
    brandSlug: 'casio',
    categorySlug: 'men',
  },
  {
    name: 'Casio Vintage A168 Gold Tone',
    slug: 'casio-vintage-a168-gold-tone',
    sku: 'CAS-VTG-005',
    shortDescription: 'Retro digital icon with timeless gold finish.',
    description:
      'Classic Casio digital design featuring alarm, stopwatch, and electro-luminescent backlight in a nostalgic compact case.',
    price: '79.00',
    originalPrice: '99.00',
    stock: 40,
    isFeatured: false,
    brandSlug: 'casio',
    categorySlug: 'women',
  },
  {
    name: 'Casio Youth Analog Blue Dial',
    slug: 'casio-youth-analog-blue-dial',
    sku: 'CAS-YTH-006',
    shortDescription: 'Comfortable and simple analog watch for younger users.',
    description:
      'Reliable Casio youth series watch with easy-to-read numerals, lightweight resin strap, and practical day-to-day durability.',
    price: '49.00',
    originalPrice: '65.00',
    stock: 55,
    isFeatured: false,
    brandSlug: 'casio',
    categorySlug: 'kids',
  },
  {
    name: 'G-shock GA-2100 Carbon Core Black',
    slug: 'g-shock-ga-2100-carbon-core-black',
    sku: 'GSH-210-007',
    shortDescription: 'Ultra-tough octagonal G-shock with carbon core guard.',
    description:
      'Shock-resistant design with world time, stopwatch, countdown timer, and 200m water resistance built for extreme everyday wear.',
    price: '189.00',
    originalPrice: '220.00',
    stock: 30,
    isFeatured: true,
    brandSlug: 'g-shock',
    categorySlug: 'men',
  },
  {
    name: 'G-shock Baby-G Pink Tough Model',
    slug: 'g-shock-baby-g-pink-tough-model',
    sku: 'GSH-BBG-008',
    shortDescription: 'Compact shock-resistant model with bold color accents.',
    description:
      'Baby-G inspired by active lifestyles, featuring impact protection, comfortable resin build, and clear digital display.',
    price: '149.00',
    originalPrice: '179.00',
    stock: 22,
    isFeatured: false,
    brandSlug: 'g-shock',
    categorySlug: 'women',
  },
  {
    name: 'G-shock GA-B2100 Bluetooth Solar',
    slug: 'g-shock-ga-b2100-bluetooth-solar',
    sku: 'GSH-BLU-009',
    shortDescription: 'Tough solar and Bluetooth connected all-terrain watch.',
    description:
      'Modern G-shock with smartphone sync, solar charging, and all-day durability for professionals and outdoor enthusiasts.',
    price: '239.00',
    originalPrice: '289.00',
    stock: 16,
    isFeatured: true,
    brandSlug: 'g-shock',
    categorySlug: 'classic',
  },
  {
    name: 'NaviForce Military Chrono Khaki',
    slug: 'naviforce-military-chrono-khaki',
    sku: 'NAV-MIL-010',
    shortDescription: 'Bold military styling with sport chronograph display.',
    description:
      'NaviForce model engineered for value and style, combining rugged visuals, large numerals, and dependable quartz timing.',
    price: '95.00',
    originalPrice: '129.00',
    stock: 34,
    isFeatured: false,
    brandSlug: 'naviforce',
    categorySlug: 'men',
  },
  {
    name: 'NaviForce Couple Set Silver Black',
    slug: 'naviforce-couple-set-silver-black',
    sku: 'NAV-CPL-011',
    shortDescription: 'Coordinated his-and-hers set with matching premium finish.',
    description:
      'Designed for gifting, this couple set features harmonious dial layout and polished bracelets suited for daily and occasion wear.',
    price: '169.00',
    originalPrice: '210.00',
    stock: 12,
    isFeatured: true,
    brandSlug: 'naviforce',
    categorySlug: 'couple',
  },
  {
    name: 'NaviForce Sport Kids Blue Resin',
    slug: 'naviforce-sport-kids-blue-resin',
    sku: 'NAV-KID-012',
    shortDescription: 'Bright and durable kid-friendly sports watch.',
    description:
      'Comfortable resin case and strap with simplified dial design to help young users read time confidently and comfortably.',
    price: '39.00',
    originalPrice: '55.00',
    stock: 60,
    isFeatured: false,
    brandSlug: 'naviforce',
    categorySlug: 'kids',
  },
  {
    name: 'Fossil Grant Chronograph Brown Leather',
    slug: 'fossil-grant-chronograph-brown-leather',
    sku: 'FOS-GRA-013',
    shortDescription: 'Classic Roman numeral dial with rich leather strap.',
    description:
      'A timeless Fossil chronograph that blends heritage styling with practical sub-dials and versatile formal-casual appeal.',
    price: '199.00',
    originalPrice: '249.00',
    stock: 21,
    isFeatured: true,
    brandSlug: 'fossil',
    categorySlug: 'classic',
  },
  {
    name: 'Fossil Jacqueline Women Mesh Rose',
    slug: 'fossil-jacqueline-women-mesh-rose',
    sku: 'FOS-JAQ-014',
    shortDescription: 'Slim women watch with elegant rose mesh bracelet.',
    description:
      'Minimalist Fossil women watch featuring a refined dial profile and lightweight mesh strap designed for office and evening wear.',
    price: '175.00',
    originalPrice: '220.00',
    stock: 19,
    isFeatured: false,
    brandSlug: 'fossil',
    categorySlug: 'women',
  },
  {
    name: 'Fossil Neutra Chrono Blue Sunray',
    slug: 'fossil-neutra-chrono-blue-sunray',
    sku: 'FOS-NEU-015',
    shortDescription: 'Modern chronograph with crisp blue sunray dial.',
    description:
      'Balanced proportions, clear chronograph registers, and premium finishing make this Neutra model a reliable upscale daily choice.',
    price: '210.00',
    originalPrice: '265.00',
    stock: 17,
    isFeatured: false,
    brandSlug: 'fossil',
    categorySlug: 'men',
  },
  {
    name: 'Al Fajr Azan Watch WA-10 Black',
    slug: 'al-fajr-azan-watch-wa-10-black',
    sku: 'AFJ-WA1-016',
    shortDescription: 'Prayer time watch with global city support.',
    description:
      'Al Fajr Islamic watch featuring accurate azan reminders, qibla direction support, and practical alarm scheduling for everyday use.',
    price: '155.00',
    originalPrice: '189.00',
    stock: 15,
    isFeatured: true,
    brandSlug: 'al-fajr',
    categorySlug: 'men',
  },
  {
    name: 'Al Fajr Azan Women White Gold',
    slug: 'al-fajr-azan-women-white-gold',
    sku: 'AFJ-WMN-017',
    shortDescription: 'Elegant women azan watch with soft white dial.',
    description:
      'Designed for women seeking practical prayer features and graceful styling, with easy menu controls and comfortable strap fit.',
    price: '149.00',
    originalPrice: '179.00',
    stock: 14,
    isFeatured: false,
    brandSlug: 'al-fajr',
    categorySlug: 'women',
  },
  {
    name: 'Al HArameen Digital Azan HA-6102',
    slug: 'al-harameen-digital-azan-ha-6102',
    sku: 'HAR-610-018',
    shortDescription: 'Feature-rich digital azan watch with large display.',
    description:
      'Al HArameen model with city-based prayer schedule, hijri calendar utilities, and long battery life for consistent daily performance.',
    price: '129.00',
    originalPrice: '160.00',
    stock: 23,
    isFeatured: false,
    brandSlug: 'al-harameen',
    categorySlug: 'men',
  },
  {
    name: 'Al HArameen Couple Azan Set Dual Tone',
    slug: 'al-harameen-couple-azan-set-dual-tone',
    sku: 'HAR-CPL-019',
    shortDescription: 'Matching couple set with Islamic digital features.',
    description:
      'Dual-tone coordinated pair for couples, integrating prayer alerts and everyday clock functions in a gift-ready style.',
    price: '225.00',
    originalPrice: '279.00',
    stock: 10,
    isFeatured: true,
    brandSlug: 'al-harameen',
    categorySlug: 'couple',
  },
  {
    name: 'Curren Business Quartz Silver Blue',
    slug: 'curren-business-quartz-silver-blue',
    sku: 'CUR-BUS-020',
    shortDescription: 'Affordable business-style quartz watch with steel bracelet.',
    description:
      'Curren entry-luxury design with clean index markers and polished metal finishing, ideal for office-ready daily wear.',
    price: '65.00',
    originalPrice: '89.00',
    stock: 45,
    isFeatured: false,
    brandSlug: 'curren',
    categorySlug: 'men',
  },
];

const heroBanners: SeedHeroBanner[] = [
  {
    title: 'Casio Edifice Collection',
    subtitle: 'Precision style for every day',
    imageUrl:
      'https://www.fossil.com/on/demandware.static/-/Library-Sites-FossilSharedLibrary/default/dwe241ef64/2022/FA22/set_0905_global/heritage_lp/0905_LP_hero1_Videostill_Desktop.jpg',
    targetUrl: '/brands/casio',
    sortOrder: 1,
  },
  {
    title: 'Fossil Urban Classics',
    subtitle: 'Modern heritage, timeless finish',
    imageUrl: 'https://i.postimg.cc/153pqDXL/naviposter.png',
    targetUrl: '/brands/fossil',
    sortOrder: 2,
  },
  {
    title: 'G-Shock Performance',
    subtitle: 'Built for action and everyday toughness',
    imageUrl:
      'https://mir-s3-cdn-cf.behance.net/project_modules/max_632_webp/1eb4e2207356687.66dc0e0c2d11d.jpg',
    targetUrl: '/brands/g-shock',
    sortOrder: 3,
  },
];

const celebrityLooks: SeedCelebrityLook[] = [
  {
    name: 'Casio Edifice Moments',
    slug: 'casio-edifice-moments',
    title: 'Casio Signature Moments',
    description: 'Casio essentials curated for a clean, everyday performance look.',
    imageUrl: 'https://static.helioswatchstore.com/media/easyslide/1RagaGlimmers_1.jpg',
    brandSlug: 'casio',
    productSlugs: [
      'casio-youth-analog-blue-dial',
      'casio-vintage-a168-gold-tone',
      'casio-edifice-chronograph-black-steel',
    ],
  },
  {
    name: 'Fossil Urban Classics',
    slug: 'fossil-urban-classics',
    title: 'Fossil Urban Classics',
    description: 'An urban Fossil edit balancing minimalist design and chrono utility.',
    imageUrl: 'https://static.helioswatchstore.com/media/easyslide/11Fossil_2.jpg',
    brandSlug: 'fossil',
    productSlugs: [
      'fossil-neutra-chrono-blue-sunray',
      'fossil-jacqueline-women-mesh-rose',
      'fossil-grant-chronograph-brown-leather',
    ],
  },
  {
    name: 'G-Shock Performance Line',
    slug: 'g-shock-performance-line',
    title: 'G-Shock Performance Line',
    description: 'High-impact G-Shock watches curated for motion and durability.',
    imageUrl: 'https://static.helioswatchstore.com/media/easyslide/3G-SHOCK_1.jpg',
    brandSlug: 'g-shock',
    productSlugs: [
      'g-shock-ga-b2100-bluetooth-solar',
      'g-shock-baby-g-pink-tough-model',
      'g-shock-ga-2100-carbon-core-black',
    ],
  },
  {
    name: 'G-Shock Urban Contrast',
    slug: 'g-shock-urban-contrast',
    title: 'G-Shock Urban Contrast',
    description: 'Street-oriented G-Shock combinations with strong visual contrast.',
    imageUrl: 'https://static.helioswatchstore.com/media/easyslide/12G-SHOCK-1_2.jpg',
    brandSlug: 'g-shock',
    productSlugs: [
      'g-shock-ga-b2100-bluetooth-solar',
      'g-shock-baby-g-pink-tough-model',
      'g-shock-ga-2100-carbon-core-black',
    ],
  },
  {
    name: 'Casio Cocktail Collection',
    slug: 'casio-cocktail-collection',
    title: 'Casio Cocktail Collection',
    description: 'A vibrant Casio curation inspired by color, shine, and occasion wear.',
    imageUrl: 'https://static.helioswatchstore.com/media/easyslide/2RagaCocktails_1.jpg',
    brandSlug: 'casio',
    productSlugs: [
      'casio-youth-analog-blue-dial',
      'casio-vintage-a168-gold-tone',
      'casio-edifice-chronograph-black-steel',
    ],
  },
];

function productImageUrls(productSlug: string): string[] {
  return [DEFAULT_PRODUCT_IMAGE_URL];
}

async function seedBrands(): Promise<Map<string, number>> {
  const brandMap = new Map<string, number>();

  for (const brand of brands) {
    const saved = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        isActive: true,
      },
      create: {
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        isActive: true,
      },
    });

    if (!saved.logo) {
      await prisma.brand.update({
        where: { id: saved.id },
        data: { logo: brand.logo },
      });
    }

    brandMap.set(brand.slug, saved.id);
  }

  return brandMap;
}

async function seedCategories(): Promise<Map<string, number>> {
  const categoryMap = new Map<string, number>();

  for (const category of categories.filter((item) => !item.parentSlug)) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        parentId: null,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        isActive: true,
      },
    });

    categoryMap.set(category.slug, saved.id);
  }

  for (const category of categories.filter((item) => item.parentSlug)) {
    const parentId = categoryMap.get(category.parentSlug as string);

    if (!parentId) {
      throw new Error(`Missing parent category for ${category.slug}`);
    }

    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        parentId,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        parentId,
        isActive: true,
      },
    });

    categoryMap.set(category.slug, saved.id);
  }

  return categoryMap;
}

async function seedProducts(
  brandMap: Map<string, number>,
  categoryMap: Map<string, number>,
): Promise<void> {
  for (const product of products) {
    const brandId = brandMap.get(product.brandSlug);
    const categoryId = categoryMap.get(product.categorySlug);

    if (!brandId) {
      throw new Error(`Missing brand for ${product.slug}: ${product.brandSlug}`);
    }

    if (!categoryId) {
      throw new Error(`Missing category for ${product.slug}: ${product.categorySlug}`);
    }

    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        sku: product.sku,
        modelNumber: product.modelNumber ?? product.sku,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        isFeatured: product.isFeatured,
        isActive: true,
        publishedAt: STABLE_PUBLISHED_AT,
        brandId,
        categoryId,
      },
      create: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        modelNumber: product.modelNumber ?? product.sku,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        isFeatured: product.isFeatured,
        isActive: true,
        publishedAt: STABLE_PUBLISHED_AT,
        brandId,
        categoryId,
      },
    });

    const existingImageCount = await prisma.productImage.count({
      where: { productId: saved.id },
    });

    if (existingImageCount === 0) {
      await prisma.productImage.createMany({
        data: productImageUrls(product.slug).map((url, index) => ({
          productId: saved.id,
          url,
          sortOrder: index,
        })),
      });
    }
  }
}

async function seedHeroBanners(): Promise<void> {
  for (const banner of heroBanners) {
    const existing = await prisma.heroBanner.findFirst({
      where: { title: banner.title },
      select: { id: true },
    });

    if (existing) {
      await prisma.heroBanner.update({
        where: { id: existing.id },
        data: {
          subtitle: banner.subtitle,
          targetUrl: banner.targetUrl,
          sortOrder: banner.sortOrder,
          isActive: true,
          publishedAt: STABLE_PUBLISHED_AT,
        },
      });

      continue;
    }

    await prisma.heroBanner.create({
      data: {
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl,
        targetUrl: banner.targetUrl,
        sortOrder: banner.sortOrder,
        isActive: true,
        publishedAt: STABLE_PUBLISHED_AT,
      },
    });
  }
}

async function seedCelebrityLooks(brandMap: Map<string, number>): Promise<void> {
  const expectedProductSlugs = Array.from(
    new Set(celebrityLooks.flatMap((look) => look.productSlugs)),
  );

  const productsBySlug = new Map<string, number>();
  const matchedProducts = await prisma.product.findMany({
    where: {
      slug: {
        in: expectedProductSlugs,
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  for (const product of matchedProducts) {
    productsBySlug.set(product.slug, product.id);
  }

  const missingSlugs = expectedProductSlugs.filter((slug) => !productsBySlug.has(slug));
  if (missingSlugs.length > 0) {
    throw new Error(`Missing products for celebrity looks: ${missingSlugs.join(', ')}`);
  }

  for (const look of celebrityLooks) {
    const brandId = brandMap.get(look.brandSlug);

    if (!brandId) {
      throw new Error(`Missing brand for celebrity look ${look.slug}: ${look.brandSlug}`);
    }

    const savedLook = await prisma.celebrityLook.upsert({
      where: { slug: look.slug },
      update: {
        brandId,
        name: look.name,
        title: look.title,
        description: look.description,
        isActive: true,
        publishedAt: STABLE_PUBLISHED_AT,
      },
      create: {
        brandId,
        name: look.name,
        slug: look.slug,
        title: look.title,
        description: look.description,
        imageUrl: look.imageUrl,
        isActive: true,
        publishedAt: STABLE_PUBLISHED_AT,
      },
    });

    await prisma.celebrityLookProduct.deleteMany({
      where: { celebrityLookId: savedLook.id },
    });

    await prisma.celebrityLookProduct.createMany({
      data: look.productSlugs.map((slug, index) => ({
        celebrityLookId: savedLook.id,
        productId: productsBySlug.get(slug) as number,
        sortOrder: index,
      })),
    });
  }
}

async function seedAdminUser(): Promise<void> {
  const passwordHash = await hash('Aliasgar1234@#', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      firstName: 'System',
      lastName: 'Admin',
      password: passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: 'admin@gmail.com',
      firstName: 'System',
      lastName: 'Admin',
      password: passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  await prisma.cart.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
    },
  });
}

async function main(): Promise<void> {
  console.log('Starting database seed...');

  const brandMap = await seedBrands();
  const categoryMap = await seedCategories();

  await seedProducts(brandMap, categoryMap);
  await seedHeroBanners();
  await seedCelebrityLooks(brandMap);
  await seedAdminUser();

  console.log('Seed completed successfully.');
  console.log(`Brands seeded: ${brands.length}`);
  console.log(`Categories seeded: ${categories.length}`);
  console.log(`Products seeded: ${products.length}`);
  console.log(`Hero banners seeded: ${heroBanners.length}`);
  console.log(`Celebrity looks seeded: ${celebrityLooks.length}`);
  console.log('Admin user ensured: admin@gmail.com');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
