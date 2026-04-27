import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	OrderStatus,
	PaymentStatus,
	Prisma,
	Role,
	type Product,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { CreateAdminProductDto } from './dto/create-admin-product.dto';
import { QueryAdminOrdersDto } from './dto/query-admin-orders.dto';
import { QueryAdminProductsDto } from './dto/query-admin-products.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly mediaService: MediaService,
	) {}

	async getProducts(query: QueryAdminProductsDto) {
		const statusFilter: Prisma.ProductWhereInput =
			query.status === 'active'
				? { isActive: true }
				: query.status === 'inactive'
					? { isActive: false }
					: query.status === 'published'
						? { isPublished: true }
						: query.status === 'draft'
							? { isPublished: false }
							: {};

		const where: Prisma.ProductWhereInput = {
			deletedAt: null,
			...(query.search
				? {
						OR: [
							{ name: { contains: query.search, mode: 'insensitive' } },
							{ sku: { contains: query.search, mode: 'insensitive' } },
							{ slug: { contains: query.search, mode: 'insensitive' } },
						],
					}
				: {}),
			...(query.brandId ? { brandId: query.brandId } : {}),
			...(query.categoryId ? { categoryId: query.categoryId } : {}),
			...statusFilter,
			...(query.isPublished !== undefined ? { isPublished: query.isPublished } : {}),
			...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
		};

		const [total, items] = await this.prisma.$transaction([
			this.prisma.product.count({ where }),
			this.prisma.product.findMany({
				where,
				skip: (query.page - 1) * query.limit,
				take: query.limit,
				orderBy: { [query.sortBy]: query.sortOrder },
				include: {
					brand: { select: { id: true, name: true, slug: true } },
					category: { select: { id: true, name: true, slug: true } },
					images: { orderBy: { sortOrder: 'asc' }, select: { url: true, sortOrder: true } },
				},
			}),
		]);

		return {
			success: true,
			data: {
				items: items.map((item) => this.toAdminProductResponse(item)),
				pagination: {
					page: query.page,
					limit: query.limit,
					total,
					totalPages: Math.max(1, Math.ceil(total / query.limit)),
				},
			},
		};
	}

	async getProductById(id: number) {
		const product = await this.prisma.product.findFirst({
			where: { id, deletedAt: null },
			include: {
				brand: { select: { id: true, name: true, slug: true } },
				category: { select: { id: true, name: true, slug: true } },
				images: { orderBy: { sortOrder: 'asc' }, select: { url: true, sortOrder: true } },
			},
		});

		if (!product) {
			throw new NotFoundException('Product not found');
		}

		return {
			success: true,
			data: this.toAdminProductResponse(product),
		};
	}

	async createProduct(dto: CreateAdminProductDto) {
		const slug = await this.getUniqueSlug(dto.slug ?? dto.name);
		const sku = dto.sku.trim().toUpperCase();
		await this.assertSkuAvailable(sku);
		await this.assertCatalogRefs(dto.brandId, dto.categoryId);

		const created = await this.prisma.product.create({
			data: {
				name: dto.name.trim(),
				slug,
				sku,
				modelNumber: dto.modelNumber?.trim() ?? sku,
				shortDescription: dto.shortDescription?.trim() ?? null,
				description: dto.description.trim(),
				brandId: dto.brandId,
				categoryId: dto.categoryId,
				price: dto.price,
				salePrice: dto.salePrice,
				originalPrice: dto.originalPrice,
				currency: dto.currency?.trim().toUpperCase() ?? 'AED',
				stock: dto.stock,
				thumbnail: dto.thumbnail ?? dto.images?.[0] ?? null,
				videoUrl: dto.videoUrl ?? null,
				tags: dto.tags ?? [],
				seoTitle: dto.metaTitle ?? null,
				seoDescription: dto.metaDescription ?? null,
				metaTitle: dto.metaTitle ?? null,
				metaDescription: dto.metaDescription ?? null,
				gender: dto.gender ?? null,
				movement: dto.movement ?? null,
				bandMaterial: dto.bandMaterial ?? null,
				bandColor: dto.bandColor ?? null,
				strapLength: dto.strapLength ?? null,
				dialColor: dto.dialColor ?? null,
				dialType: dto.dialType ?? null,
				dialShape: dto.dialShape ?? null,
				caseSizeDiameter: dto.caseSizeDiameter ?? null,
				whatsInTheBox: dto.whatsInTheBox ?? null,
				modelName: dto.modelName ?? null,
				strapMaterial: dto.strapMaterial ?? null,
				caseMaterial: dto.caseMaterial ?? null,
				waterResistance: dto.waterResistance ?? null,
				warranty: dto.warranty ?? null,
				isFeatured: dto.isFeatured ?? false,
				isBestSeller: dto.isBestSeller ?? false,
				isPublished: dto.isPublished ?? false,
				isActive: dto.isActive ?? true,
				publishedAt: dto.isPublished ? new Date() : null,
				images: dto.images?.length
					? {
							createMany: {
								data: dto.images.map((url, index) => ({
									url,
									sortOrder: index,
								})),
							},
						}
					: undefined,
			},
			include: {
				brand: { select: { id: true, name: true, slug: true } },
				category: { select: { id: true, name: true, slug: true } },
				images: { orderBy: { sortOrder: 'asc' }, select: { url: true, sortOrder: true } },
			},
		});

		return {
			success: true,
			data: this.toAdminProductResponse(created),
		};
	}

	async updateProduct(id: number, dto: UpdateAdminProductDto) {
		const existing = await this.prisma.product.findFirst({
			where: { id, deletedAt: null },
			select: {
				id: true,
				sku: true,
				videoUrl: true,
				images: {
					select: { url: true },
				},
			},
		});

		if (!existing) {
			throw new NotFoundException('Product not found');
		}

		if (dto.sku && dto.sku.trim().toUpperCase() !== existing.sku) {
			await this.assertSkuAvailable(dto.sku.trim().toUpperCase());
		}

		if (dto.brandId || dto.categoryId) {
			await this.assertCatalogRefs(dto.brandId, dto.categoryId);
		}

		const resolvedSlug = dto.slug
			? await this.getUniqueSlug(dto.slug, id)
			: dto.name
				? await this.getUniqueSlug(dto.name, id)
				: undefined;

		const updated = await this.prisma.$transaction(async (tx) => {
			const saved = await tx.product.update({
				where: { id },
				data: {
					...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
					...(resolvedSlug !== undefined ? { slug: resolvedSlug } : {}),
					...(dto.sku !== undefined ? { sku: dto.sku.trim().toUpperCase() } : {}),
					...(dto.modelNumber !== undefined ? { modelNumber: dto.modelNumber.trim() } : {}),
					...(dto.shortDescription !== undefined
						? { shortDescription: dto.shortDescription?.trim() ?? null }
						: {}),
					...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
					...(dto.brandId !== undefined ? { brandId: dto.brandId } : {}),
					...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
					...(dto.price !== undefined ? { price: dto.price } : {}),
					...(dto.salePrice !== undefined ? { salePrice: dto.salePrice } : {}),
					...(dto.originalPrice !== undefined ? { originalPrice: dto.originalPrice } : {}),
					...(dto.currency !== undefined ? { currency: dto.currency.trim().toUpperCase() } : {}),
					...(dto.stock !== undefined ? { stock: dto.stock } : {}),
					...(dto.thumbnail !== undefined ? { thumbnail: dto.thumbnail } : {}),
					...(dto.videoUrl !== undefined ? { videoUrl: dto.videoUrl } : {}),
					...(dto.tags !== undefined ? { tags: dto.tags } : {}),
					...(dto.metaTitle !== undefined
						? { seoTitle: dto.metaTitle, metaTitle: dto.metaTitle }
						: {}),
					...(dto.metaDescription !== undefined
						? { seoDescription: dto.metaDescription, metaDescription: dto.metaDescription }
						: {}),
					...(dto.gender !== undefined ? { gender: dto.gender } : {}),
					...(dto.movement !== undefined ? { movement: dto.movement } : {}),
					...(dto.bandMaterial !== undefined ? { bandMaterial: dto.bandMaterial } : {}),
					...(dto.bandColor !== undefined ? { bandColor: dto.bandColor } : {}),
					...(dto.strapLength !== undefined ? { strapLength: dto.strapLength } : {}),
					...(dto.dialColor !== undefined ? { dialColor: dto.dialColor } : {}),
					...(dto.dialType !== undefined ? { dialType: dto.dialType } : {}),
					...(dto.dialShape !== undefined ? { dialShape: dto.dialShape } : {}),
					...(dto.caseSizeDiameter !== undefined ? { caseSizeDiameter: dto.caseSizeDiameter } : {}),
					...(dto.whatsInTheBox !== undefined ? { whatsInTheBox: dto.whatsInTheBox } : {}),
					...(dto.modelName !== undefined ? { modelName: dto.modelName } : {}),
					...(dto.strapMaterial !== undefined ? { strapMaterial: dto.strapMaterial } : {}),
					...(dto.caseMaterial !== undefined ? { caseMaterial: dto.caseMaterial } : {}),
					...(dto.waterResistance !== undefined ? { waterResistance: dto.waterResistance } : {}),
					...(dto.warranty !== undefined ? { warranty: dto.warranty } : {}),
					...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
					...(dto.isBestSeller !== undefined ? { isBestSeller: dto.isBestSeller } : {}),
					...(dto.isPublished !== undefined
						? {
								isPublished: dto.isPublished,
								publishedAt: dto.isPublished ? new Date() : null,
							}
						: {}),
					...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
				},
			});

			if (dto.images) {
				await tx.productImage.deleteMany({ where: { productId: id } });

				if (dto.images.length > 0) {
					await tx.productImage.createMany({
						data: dto.images.map((url, index) => ({
							productId: id,
							url,
							sortOrder: index,
						})),
					});
				}
			}

			return saved;
		});

		if (dto.images) {
			const incomingUrls = dto.images ?? [];
			const previousUrls = existing.images.map((image) => image.url);
			const removedUrls = previousUrls.filter((url) => !incomingUrls.includes(url));
			await this.mediaService.deleteByUrls(removedUrls);
		}

		if (dto.videoUrl !== undefined && existing.videoUrl && dto.videoUrl !== existing.videoUrl) {
			await this.mediaService.deleteByUrls([existing.videoUrl]);
		}

		return this.getProductById(updated.id);
	}

	async deleteProduct(id: number) {
		// Get the existing product with all related data for cleanup
		const existing = await this.prisma.product.findFirst({
			where: { id, deletedAt: null },
			include: {
				images: { select: { url: true } },
				_count: {
					select: {
						cartItems: true,
						orderItems: true,
					},
				},
			},
		});

		if (!existing) {
			throw new NotFoundException('Product not found');
		}

		// Check if product is in active carts or orders
		if (existing._count.cartItems > 0) {
			throw new BadRequestException('Cannot delete product: it is currently in shopping carts');
		}

		if (existing._count.orderItems > 0) {
			throw new BadRequestException('Cannot delete product: it is referenced in orders');
		}

		// Delete the product and all related data in a transaction
		await this.prisma.$transaction(async (tx) => {
			// Delete product images
			await tx.productImage.deleteMany({
				where: { productId: id },
			});

			// Delete the product (hard delete)
			await tx.product.delete({
				where: { id },
			});
		});

		// Clean up media files from storage
		if (existing.images.length > 0) {
			const imageUrls = existing.images.map((img) => img.url);
			await this.mediaService.deleteByUrls(imageUrls);
		}

		// Clean up video if exists
		if (existing.videoUrl) {
			await this.mediaService.deleteByUrls([existing.videoUrl]);
		}

		return {
			success: true,
			data: { id },
		};
	}

	async getOrders(query: QueryAdminOrdersDto) {
		const mappedPayment = query.paymentStatus
			? this.toDbPaymentStatus(query.paymentStatus)
			: undefined;

		const where: Prisma.OrderWhereInput = {
			...(query.status ? { status: query.status as OrderStatus } : {}),
			...(mappedPayment ? { paymentStatus: mappedPayment } : {}),
			...(query.search
				? {
						OR: [
							{ uuid: { contains: query.search, mode: 'insensitive' } },
							{ user: { email: { contains: query.search, mode: 'insensitive' } } },
							{ customerEmail: { contains: query.search, mode: 'insensitive' } },
						],
					}
				: {}),
		};

		const [total, items] = await this.prisma.$transaction([
			this.prisma.order.count({ where }),
			this.prisma.order.findMany({
				where,
				skip: (query.page - 1) * query.limit,
				take: query.limit,
				orderBy: { createdAt: 'desc' },
				include: {
					user: {
						select: {
							id: true,
							email: true,
							firstName: true,
							lastName: true,
							phone: true,
						},
					},
					items: {
						include: {
							product: {
								select: {
									id: true,
									name: true,
									slug: true,
									thumbnail: true,
								},
							},
						},
					},
				},
			}),
		]);

		return {
			success: true,
			data: {
				items: items.map((item) => this.toAdminOrderResponse(item)),
				pagination: {
					page: query.page,
					limit: query.limit,
					total,
					totalPages: Math.max(1, Math.ceil(total / query.limit)),
				},
			},
		};
	}

	async getOrderById(id: number) {
		const order = await this.prisma.order.findUnique({
			where: { id },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						firstName: true,
						lastName: true,
						phone: true,
					},
				},
				items: {
					include: {
						product: {
							select: {
								id: true,
								name: true,
								slug: true,
								thumbnail: true,
							},
						},
					},
				},
			},
		});

		if (!order) {
			throw new NotFoundException('Order not found');
		}

		return {
			success: true,
			data: this.toAdminOrderResponse(order),
		};
	}

	async updateOrderStatus(id: number, status: OrderStatus) {
		await this.assertOrderExists(id);
		const updated = await this.prisma.order.update({
			where: { id },
			data: { status },
		});

		return {
			success: true,
			data: {
				id: updated.id,
				status: updated.status,
			},
		};
	}

	async updateOrderPaymentStatus(id: number, paymentStatus: string) {
		await this.assertOrderExists(id);

		const mappedPayment = this.toDbPaymentStatus(paymentStatus);
		const updated = await this.prisma.order.update({
			where: { id },
			data: { paymentStatus: mappedPayment },
		});

		return {
			success: true,
			data: {
				id: updated.id,
				paymentStatus: this.toApiPaymentStatus(updated.paymentStatus),
			},
		};
	}

	async getUsers(page: number, limit: number, search?: string) {
		const where: Prisma.UserWhereInput = {
			...(search
				? {
						OR: [
							{ email: { contains: search, mode: 'insensitive' } },
							{ firstName: { contains: search, mode: 'insensitive' } },
							{ lastName: { contains: search, mode: 'insensitive' } },
						],
					}
				: {}),
		};

		const [total, items] = await this.prisma.$transaction([
			this.prisma.user.count({ where }),
			this.prisma.user.findMany({
				where,
				skip: (page - 1) * limit,
				take: limit,
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					phone: true,
					role: true,
					isActive: true,
					createdAt: true,
				},
			}),
		]);

		return {
			success: true,
			data: {
				items,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.max(1, Math.ceil(total / limit)),
				},
			},
		};
	}

	async updateUserRole(userId: number, dto: UpdateUserRoleDto, actorRole: Role) {
		if (dto.role === 'SUPER_ADMIN' && actorRole !== Role.SUPER_ADMIN) {
			throw new BadRequestException('Only a super admin can grant SUPER_ADMIN role');
		}

		const updated = await this.prisma.user.update({
			where: { id: userId },
			data: {
				role: dto.role as Role,
				...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				isActive: true,
			},
		});

		return {
			success: true,
			data: updated,
		};
	}

	private async assertSkuAvailable(sku: string): Promise<void> {
		const existing = await this.prisma.product.findFirst({
			where: { sku, deletedAt: null },
			select: { id: true },
		});

		if (existing) {
			throw new ConflictException('SKU already exists');
		}
	}

	private async assertCatalogRefs(brandId?: number, categoryId?: number): Promise<void> {
		const [brand, category] = await Promise.all([
			brandId
				? this.prisma.brand.findFirst({ where: { id: brandId, isActive: true }, select: { id: true } })
				: null,
			categoryId
				? this.prisma.category.findFirst({
						where: { id: categoryId, isActive: true },
						select: { id: true },
					})
				: null,
		]);

		if (brandId && !brand) {
			throw new BadRequestException('Brand does not exist or inactive');
		}

		if (categoryId && !category) {
			throw new BadRequestException('Category does not exist or inactive');
		}
	}

	private async getUniqueSlug(seed: string, excludeId?: number): Promise<string> {
		const baseSlug = this.slugify(seed);
		let slug = baseSlug;
		let suffix = 1;

		while (true) {
			const existing = await this.prisma.product.findFirst({
				where: {
					slug,
					deletedAt: null,
					...(excludeId ? { id: { not: excludeId } } : {}),
				},
				select: { id: true },
			});

			if (!existing) {
				return slug;
			}

			suffix += 1;
			slug = `${baseSlug}-${suffix}`;
		}
	}

	private slugify(value: string): string {
		return value
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 180);
	}

	private decimalToNumber(value: Prisma.Decimal | number | null | undefined): number | null {
		if (value === null || value === undefined) {
			return null;
		}

		return typeof value === 'number' ? value : value.toNumber();
	}

	private toAdminProductResponse(product: Product & Record<string, unknown>) {
		return {
			...product,
			price: this.decimalToNumber(product.price as Prisma.Decimal),
			salePrice: this.decimalToNumber(product.salePrice as Prisma.Decimal | null),
			originalPrice: this.decimalToNumber(product.originalPrice as Prisma.Decimal | null),
		};
	}

	private toApiPaymentStatus(status: PaymentStatus): string {
		return status === PaymentStatus.PENDING ? 'UNPAID' : status;
	}

	private toDbPaymentStatus(status: string): PaymentStatus {
		if (status === 'UNPAID') {
			return PaymentStatus.PENDING;
		}

		if (!Object.values(PaymentStatus).includes(status as PaymentStatus)) {
			throw new BadRequestException('Unsupported payment status');
		}

		return status as PaymentStatus;
	}

	private toAdminOrderResponse(
		order: Prisma.OrderGetPayload<{
			include: {
				user: {
					select: {
						id: true;
						email: true;
						firstName: true;
						lastName: true;
						phone: true;
					};
				};
				items: {
					include: {
						product: {
							select: {
								id: true;
								name: true;
								slug: true;
								thumbnail: true;
							};
						};
					};
				};
			};
		}>,
	) {
		return {
			id: order.id,
			uuid: order.uuid,
			status: order.status,
			paymentStatus: this.toApiPaymentStatus(order.paymentStatus),
			customer: {
				id: order.user.id,
				name: `${order.user.firstName} ${order.user.lastName}`.trim(),
				email: order.customerEmail ?? order.user.email,
				phone: order.customerPhone ?? order.user.phone,
			},
			items: order.items.map((item) => ({
				id: item.id,
				productId: item.productId,
				productName: item.product?.name,
				productSlug: item.product?.slug,
				productThumbnail: item.product?.thumbnail,
				quantity: item.quantity,
				price: this.decimalToNumber(item.price),
			})),
			subtotal: this.decimalToNumber(order.subtotal),
			discount: this.decimalToNumber(order.discount),
			total: this.decimalToNumber(order.total),
			shippingFee: this.decimalToNumber(order.shippingFee),
			shippingAddress: order.shippingAddress,
			notes: order.notes,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
		};
	}

	private async assertOrderExists(id: number): Promise<void> {
		const order = await this.prisma.order.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!order) {
			throw new NotFoundException('Order not found');
		}
	}
}
