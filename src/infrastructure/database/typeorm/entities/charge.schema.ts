import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTypeOrmSchema } from './base-typeorm.schema';
import { CustomerSchema } from './customer.schema';
import { PaymentMethodEnum, ChargeStatusEnum } from '@domain/entities/charge.entity';

@Entity('charges')
export class ChargeSchema extends BaseTypeOrmSchema {
  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => CustomerSchema, { eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer?: CustomerSchema;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'BRL' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodEnum,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethodEnum;

  @Column({
    type: 'enum',
    enum: ChargeStatusEnum,
    default: ChargeStatusEnum.PENDING,
  })
  status: ChargeStatusEnum;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;
}
