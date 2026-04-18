import { Controller, Get, Query } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { QueryBrandsDto } from './dto/query-brands.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  async findAll(@Query() query: QueryBrandsDto) {
    const items = await this.brandsService.findActive(query.limit);

    return {
      success: true,
      data: items,
    };
  }
}
