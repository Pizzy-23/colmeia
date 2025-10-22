import { PaymentMethodEnum, ChargeStatusEnum } from '@domain/entities/charge.entity';

export class ChargeDto {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodEnum;
  status: ChargeStatusEnum;
  description?: string;
  metadata?: Record<string, any>;
  paidAt?: Date;
  expiresAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
