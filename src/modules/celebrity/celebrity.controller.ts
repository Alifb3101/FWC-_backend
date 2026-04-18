import { Controller, Get, Param } from '@nestjs/common';
import { CelebrityService } from './celebrity.service';

@Controller('celebrity-looks')
export class CelebrityController {
  constructor(private readonly celebrityService: CelebrityService) {}

  @Get()
  async findAll() {
    const data = await this.celebrityService.findAll();

    return {
      success: true,
      data,
    };
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const data = await this.celebrityService.findBySlug(slug);

    return {
      success: true,
      data,
    };
  }
}
