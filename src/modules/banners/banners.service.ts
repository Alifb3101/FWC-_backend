import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async findHomepageBanners(limit = 5) {
    return this.prisma.heroBanner.findMany({
      where: {
        isActive: true,
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        targetUrl: true,
      },
    });
  }
}
