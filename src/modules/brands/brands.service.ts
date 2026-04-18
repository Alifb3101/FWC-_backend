import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  findActive(limit?: number) {
    return this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
      ...(limit ? { take: limit } : {}),
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });
  }
}
