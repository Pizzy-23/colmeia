import { BaseEntity } from './base-entity';
import { CustomerEntity } from './customer.entity';

export enum PaymentMethodEnum {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  BANK_SLIP = 'bank_slip',
}

export enum ChargeStatusEnum {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export class ChargeEntity extends BaseEntity {
  public customerId: string;
  public customer?: CustomerEntity;
  public amount: number;
  public currency: string;
  public paymentMethod: PaymentMethodEnum;
  public status: ChargeStatusEnum;
  public description?: string;
  public metadata?: Record<string, any>;
  public paidAt?: Date;
  public expiresAt?: Date;
  public failureReason?: string;

  constructor(
    customerId: string,
    amount: number,
    currency: string,
    paymentMethod: PaymentMethodEnum,
    description?: string,
    metadata?: Record<string, any>,
    expiresAt?: Date,
  ) {
    super();
    this.customerId = customerId;
    this.amount = amount;
    this.currency = currency;
    this.paymentMethod = paymentMethod;
    this.status = ChargeStatusEnum.PENDING;
    this.description = description;
    this.metadata = metadata;
    this.expiresAt = expiresAt;
  }

  public markAsPaid(): void {
    this.status = ChargeStatusEnum.PAID;
    this.paidAt = new Date();
  }

  public markAsFailed(reason?: string): void {
    this.status = ChargeStatusEnum.FAILED;
    this.failureReason = reason;
  }

  public markAsExpired(): void {
    this.status = ChargeStatusEnum.EXPIRED;
  }

  public cancel(): void {
    this.status = ChargeStatusEnum.CANCELLED;
  }

  public isPaid(): boolean {
    return this.status === ChargeStatusEnum.PAID;
  }

  public isPending(): boolean {
    return this.status === ChargeStatusEnum.PENDING;
  }

  public isExpired(): boolean {
    return this.status === ChargeStatusEnum.EXPIRED;
  }

  public canBePaid(): boolean {
    return this.status === ChargeStatusEnum.PENDING;
  }
}
