import { IsIn } from 'class-validator';

export class UpdateOrderPaymentStatusDto {
  @IsIn(['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'])
  paymentStatus!: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}
