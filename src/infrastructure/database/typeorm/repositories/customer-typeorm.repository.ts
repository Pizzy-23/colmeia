import { CustomerEntity } from '@domain/entities/customer.entity';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { CustomerSchema } from '../entities/customer.schema';
import { BaseTypeOrmRepository } from './base-typeorm.repository';

@Injectable()
export class TypeOrmCustomerRepository
  extends BaseTypeOrmRepository<CustomerEntity, CustomerSchema>
  implements CustomerRepository {

  constructor(
    @InjectRepository(CustomerSchema)
    protected readonly ormRepository: Repository<CustomerSchema>,
  ) {
    super(ormRepository);
  }

  async findByEmail(email: string): Promise<CustomerEntity | null> {
    const customerSchema = await this.ormRepository.findOne({
      where: { email },
    });
    return customerSchema ? this.mapSchemaToEntity(customerSchema) : null;
  }

  async findByDocument(document: string): Promise<CustomerEntity | null> {
    const customerSchema = await this.ormRepository.findOne({
      where: { document },
    });
    return customerSchema ? this.mapSchemaToEntity(customerSchema) : null;
  }

  protected mapSchemaToEntity(schema: CustomerSchema): CustomerEntity {
    const entity = new CustomerEntity();
    entity.id = schema.id;
    entity.name = schema.name;
    entity.email = schema.email;
    entity.document = schema.document;
    entity.phone = schema.phone;
    entity.createdAt = schema.createdAt;
    entity.updatedAt = schema.updatedAt;
    return entity;
  }

  protected mapEntityToSchema(entity: CustomerEntity): CustomerSchema {
    const schema = new CustomerSchema();
    if (entity.id) schema.id = entity.id;
    schema.name = entity.name;
    schema.email = entity.email;
    schema.document = entity.document;
    schema.phone = entity.phone;
    if (entity.createdAt) schema.createdAt = entity.createdAt;
    if (entity.updatedAt) schema.updatedAt = entity.updatedAt;
    return schema;
  }

  protected mapPartialEntityToSchema(partialEntity: Partial<CustomerEntity>): DeepPartial<CustomerSchema> {
    const partialSchema: DeepPartial<CustomerSchema> = {};
    if (partialEntity.name !== undefined) partialSchema.name = partialEntity.name;
    if (partialEntity.email !== undefined) partialSchema.email = partialEntity.email;
    if (partialEntity.document !== undefined) partialSchema.document = partialEntity.document;
    if (partialEntity.phone !== undefined) partialSchema.phone = partialEntity.phone;
    return partialSchema;
  }
}

