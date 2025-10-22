import { BaseRepository } from './base.repository';
import { ChargeEntity } from '../entities/charge.entity';
import { ChargeStatusEnum } from '../entities/charge.entity';

export interface ChargeRepository extends BaseRepository<ChargeEntity> {
  findByCustomerId(customerId: string): Promise<ChargeEntity[]>;
  findByStatus(status: ChargeStatusEnum): Promise<ChargeEntity[]>;
  findByPaymentMethod(paymentMethod: string): Promise<ChargeEntity[]>;
  findExpiredCharges(): Promise<ChargeEntity[]>;
  findPendingCharges(): Promise<ChargeEntity[]>;
}
