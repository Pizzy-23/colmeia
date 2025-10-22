import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { ChargeEntity, ChargeStatusEnum, PaymentMethodEnum } from '@domain/entities/charge.entity';
import { ChargeSchema } from '../entities/charge.schema';
import { BaseTypeOrmRepository } from './base-typeorm.repository';

@Injectable()
export class TypeOrmChargeRepository
  extends BaseTypeOrmRepository<ChargeEntity, ChargeSchema>
  implements ChargeRepository
{
  constructor(
    @InjectRepository(ChargeSchema)
    protected readonly ormRepository: Repository<ChargeSchema>,
  ) {
    super(ormRepository);
  }

  protected mapSchemaToEntity(schema: ChargeSchema): ChargeEntity {
    const entity = new ChargeEntity(
      schema.customerId,
      schema.amount,
      schema.currency,
      schema.paymentMethod,
      schema.description,
      schema.metadata,
      schema.expiresAt,
    );
    entity.id = schema.id;
    entity.status = schema.status;
    entity.paidAt = schema.paidAt;
    entity.failureReason = schema.failureReason;
    entity.createdAt = schema.createdAt;
    entity.updatedAt = schema.updatedAt;

    if (schema.customer) {
      entity.customer = {
        id: schema.customer.id,
        name: schema.customer.name,
        email: schema.customer.email,
        phone: schema.customer.phone,
        document: schema.customer.document,
        createdAt: schema.customer.createdAt,
        updatedAt: schema.customer.updatedAt,
      } as any;
    }

    return entity;
  }

  protected mapEntityToSchema(entity: ChargeEntity): ChargeSchema {
    const schema = new ChargeSchema();
    schema.id = entity.id;
    schema.customerId = entity.customerId;
    schema.amount = entity.amount;
    schema.currency = entity.currency;
    schema.paymentMethod = entity.paymentMethod;
    schema.status = entity.status;
    schema.description = entity.description;
    schema.metadata = entity.metadata;
    schema.paidAt = entity.paidAt;
    schema.expiresAt = entity.expiresAt;
    schema.failureReason = entity.failureReason;
    schema.createdAt = entity.createdAt;
    schema.updatedAt = entity.updatedAt;
    return schema;
  }

  async findByCustomerId(customerId: string): Promise<ChargeEntity[]> {
    const schemas = await this.ormRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
    return schemas.map(this.mapSchemaToEntity);
  }

  async findByStatus(status: ChargeStatusEnum): Promise<ChargeEntity[]> {
    const schemas = await this.ormRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
    return schemas.map(this.mapSchemaToEntity);
  }

  async findByPaymentMethod(paymentMethod: string): Promise<ChargeEntity[]> {
    const schemas = await this.ormRepository.find({
      where: { paymentMethod: paymentMethod as PaymentMethodEnum },
      order: { createdAt: 'DESC' },
    });
    return schemas.map(this.mapSchemaToEntity);
  }

  async findExpiredCharges(): Promise<ChargeEntity[]> {
    const schemas = await this.ormRepository
      .createQueryBuilder('charge')
      .where('charge.expiresAt < :now', { now: new Date() })
      .andWhere('charge.status = :status', { status: ChargeStatusEnum.PENDING })
      .orderBy('charge.createdAt', 'DESC')
      .getMany();
    return schemas.map(this.mapSchemaToEntity);
  }

  async findPendingCharges(): Promise<ChargeEntity[]> {
    return this.findByStatus(ChargeStatusEnum.PENDING);
  }

  protected mapPartialEntityToSchema(partialEntity: Partial<ChargeEntity>): DeepPartial<ChargeSchema> {
    const partialSchema: DeepPartial<ChargeSchema> = {};
    
    if (partialEntity.customerId !== undefined) {
      partialSchema.customerId = partialEntity.customerId;
    }
    if (partialEntity.amount !== undefined) {
      partialSchema.amount = partialEntity.amount;
    }
    if (partialEntity.currency !== undefined) {
      partialSchema.currency = partialEntity.currency;
    }
    if (partialEntity.paymentMethod !== undefined) {
      partialSchema.paymentMethod = partialEntity.paymentMethod;
    }
    if (partialEntity.status !== undefined) {
      partialSchema.status = partialEntity.status;
    }
    if (partialEntity.description !== undefined) {
      partialSchema.description = partialEntity.description;
    }
    if (partialEntity.metadata !== undefined) {
      partialSchema.metadata = partialEntity.metadata;
    }
    if (partialEntity.paidAt !== undefined) {
      partialSchema.paidAt = partialEntity.paidAt;
    }
    if (partialEntity.expiresAt !== undefined) {
      partialSchema.expiresAt = partialEntity.expiresAt;
    }
    if (partialEntity.failureReason !== undefined) {
      partialSchema.failureReason = partialEntity.failureReason;
    }
    
    return partialSchema;
  }
}
