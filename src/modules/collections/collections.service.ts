import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeCollections(_limit = 4) {
    const categories = await this.prisma.category.findMany({
      where: {
        slug: {
          in: ['men', 'women', 'kids'],
        },
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

    return {
      men: {
        id: categoryBySlug.get('men')?.id ?? null,
        posterUrl: 'https://i.postimg.cc/C1PyQ1c9/MENS.png',
      },
      women: {
        id: categoryBySlug.get('women')?.id ?? null,
        posterUrl: 'https://i.postimg.cc/LsrcL70Z/WOMEN.png',
      },
      kids: {
        id: categoryBySlug.get('kids')?.id ?? null,
        posterUrl: 'https://i.postimg.cc/yx0rm8SJ/KIDS.png',
      },
    };
  }
}
