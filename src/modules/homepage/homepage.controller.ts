import { Controller, Get, Query } from '@nestjs/common';
import { HomepageService } from './homepage.service';
import { QueryHomepageDto } from './dto/query-homepage.dto';

@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get()
  async getHomepage(@Query() query: QueryHomepageDto) {
    const data = await this.homepageService.getHomepage(query);

    return {
      success: true,
      message: 'Homepage data fetched successfully',
      data,
    };
  }
}
