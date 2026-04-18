import { Controller, Get, Query } from '@nestjs/common';
import { QueryBannersDto } from './dto/query-banners.dto';
import { BannersService } from './banners.service';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get('home')
  async findHomepage(@Query() query: QueryBannersDto) {
    const items = await this.bannersService.findHomepageBanners(query.limit);

    return {
      success: true,
      data: items,
    };
  }
}
