import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { OrderStatus, Role, type User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { CreateAdminProductDto } from './dto/create-admin-product.dto';
import { QueryAdminOrdersDto } from './dto/query-admin-orders.dto';
import { QueryAdminProductsDto } from './dto/query-admin-products.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';
import { UpdateOrderPaymentStatusDto } from './dto/update-order-payment-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Get('products')
	getProducts(@Query() query: QueryAdminProductsDto) {
		return this.adminService.getProducts(query);
	}

	@Get('products/:id')
	getProductById(@Param('id', ParseIntPipe) id: number) {
		return this.adminService.getProductById(id);
	}

	@Post('products')
	@Roles(Role.SUPER_ADMIN, Role.ADMIN)
	createProduct(@Body() dto: CreateAdminProductDto) {
		return this.adminService.createProduct(dto);
	}

	@Patch('products/:id')
	@Roles(Role.SUPER_ADMIN, Role.ADMIN)
	updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminProductDto) {
		return this.adminService.updateProduct(id, dto);
	}

	@Delete('products/:id')
	@Roles(Role.SUPER_ADMIN, Role.ADMIN)
	deleteProduct(@Param('id', ParseIntPipe) id: number) {
		return this.adminService.deleteProduct(id);
	}

	@Get('orders')
	getOrders(@Query() query: QueryAdminOrdersDto) {
		return this.adminService.getOrders(query);
	}

	@Get('orders/:id')
	getOrderById(@Param('id', ParseIntPipe) id: number) {
		return this.adminService.getOrderById(id);
	}

	@Patch('orders/:id/status')
	@Roles(Role.SUPER_ADMIN, Role.ADMIN)
	updateOrderStatus(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateOrderStatusDto,
	) {
		return this.adminService.updateOrderStatus(id, dto.status as OrderStatus);
	}

	@Patch('orders/:id/payment-status')
	@Roles(Role.SUPER_ADMIN, Role.ADMIN)
	updateOrderPaymentStatus(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateOrderPaymentStatusDto,
	) {
		return this.adminService.updateOrderPaymentStatus(id, dto.paymentStatus);
	}

	@Get('users')
	getUsers(
		@Query('page') pageRaw = '1',
		@Query('limit') limitRaw = '20',
		@Query('search') search?: string,
	) {
		const page = Number.isNaN(Number(pageRaw)) ? 1 : Math.max(1, Number(pageRaw));
		const limit = Number.isNaN(Number(limitRaw)) ? 20 : Math.min(100, Math.max(1, Number(limitRaw)));

		return this.adminService.getUsers(page, limit, search);
	}

	@Patch('users/:id/role')
	@Roles(Role.SUPER_ADMIN, Role.ADMIN)
	updateUserRole(
		@Param('id', ParseIntPipe) userId: number,
		@Body() dto: UpdateUserRoleDto,
		@CurrentUser() actor: Omit<User, 'password'>,
	) {
		return this.adminService.updateUserRole(userId, dto, actor.role);
	}
}
