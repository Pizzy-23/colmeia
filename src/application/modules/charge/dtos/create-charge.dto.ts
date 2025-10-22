import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, IsObject, Min, IsUUID } from 'class-validator';
import { PaymentMethodEnum } from '@domain/entities/charge.entity';

export class CreateChargeDto {
  @IsString()
  customerId: string;

  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsString()
  currency: string = 'BRL';

  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
