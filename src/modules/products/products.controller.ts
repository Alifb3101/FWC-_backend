import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, type User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';
import { QueryProductCollectionDto } from './dto/query-product-collection.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: Omit<User, 'password'>) {
    this.assertAdmin(user.role);
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    this.assertAdmin(user.role);
    return this.productsService.update(id, updateProductDto);
  }

  @Get()
  async findAll(@Query() query: QueryProductsDto) {
    if (query.collection) {
      const result = await this.productsService.getProductsByCollection(
        query.collection,
        query.page,
        query.limit,
      );

      return {
        success: true,
        data: result,
      };
    }

    const result = await this.productsService.findAll(query);

    return {
      success: true,
      data: {
        items: result.items,
        pagination: result.meta,
      },
    };
  }

  @Get('featured/list')
  findFeatured() {
    return this.productsService.findFeatured();
  }

  @Get('best-sellers')
  async findBestSellers(@Query() query: QueryProductCollectionDto) {
    const result = await this.productsService.findBestSellers(query);

    return {
      success: true,
      data: result,
    };
  }

  @Get('new-arrivals')
  async findNewArrivals(@Query() query: QueryProductCollectionDto) {
    const result = await this.productsService.findNewArrivals(query);

    return {
      success: true,
      data: result,
    };
  }

  @Get('brand/:brandSlug')
  async findByBrand(
    @Param('brandSlug') brandSlug: string,
    @Query() query: QueryProductCollectionDto,
  ) {
    const result = await this.productsService.getProductsByBrand(
      brandSlug,
      query.page,
      query.limit,
      query.includeOutOfStock,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  private assertAdmin(role: Role): void {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can manage products');
    }
  }
}
