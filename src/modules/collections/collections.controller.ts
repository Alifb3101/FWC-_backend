import { Controller, Get, Query } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { QueryHomeCollectionsDto } from './dto/query-home-collections.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('home')
  async getHomeCollections(@Query() query: QueryHomeCollectionsDto) {
    const data = await this.collectionsService.getHomeCollections(query.limit);

    return {
      success: true,
      data,
    };
  }
}
