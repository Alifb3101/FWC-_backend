import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateUserRoleDto {
  @IsIn(['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'])
  role!: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
