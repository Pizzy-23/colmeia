import { BaseRepository } from '@domain/repositories/base.repository';
import { BaseEntity as DomainBaseEntity } from '@domain/entities/base-entity';
import { Filter, applyFilters } from '@infra/database/util/query-filter.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Repository,
  DeepPartial,
  FindManyOptions,
  FindOptionsWhere,
  DeleteResult,
} from 'typeorm';
import { BaseTypeOrmSchema } from '../entities/base-typeorm.schema';

@Injectable()
export abstract class BaseTypeOrmRepository<
  TDomainEntity extends DomainBaseEntity,
  TSchema extends BaseTypeOrmSchema,
> implements BaseRepository<TDomainEntity>
{
  constructor(protected readonly ormRepository: Repository<TSchema>) {}

  protected abstract mapSchemaToEntity(schema: TSchema): TDomainEntity;
  protected abstract mapEntityToSchema(entity: TDomainEntity): TSchema;
  protected abstract mapPartialEntityToSchema(
    partialEntity: Partial<TDomainEntity>,
  ): DeepPartial<TSchema>;

  async findById(
    id: string,
    relations?: string[],
  ): Promise<TDomainEntity | null> {
    const findOptions: FindManyOptions<TSchema> = { where: { id: id as any } };
    if (relations && relations.length > 0) {
      findOptions.relations = relations;
    }
    const schema = await this.ormRepository.findOne(findOptions);
    return schema ? this.mapSchemaToEntity(schema) : null;
  }

  async save(entity: TDomainEntity): Promise<TDomainEntity> {
    const schema = this.mapEntityToSchema(entity);
    const savedSchema = await this.ormRepository.save(
      schema as DeepPartial<TSchema>,
    );
    return this.mapSchemaToEntity(savedSchema);
  }

  async delete(id: string): Promise<void> {
    const whereClause: FindOptionsWhere<TSchema> = { id: id as any };
    const deleteResult: DeleteResult =
      await this.ormRepository.delete(whereClause);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(
        `${this.ormRepository.metadata.name} with ID "${id}" not found.`,
      );
    }
  }

  async findAll(options?: {
    filter?: Filter;
    relations?: string[];
    orderBy?: { [key: string]: 'ASC' | 'DESC' };
    skip?: number;
    take?: number;
  }): Promise<TDomainEntity[]> {
    const alias = this.ormRepository.metadata.name.toLowerCase();
    let qb = this.ormRepository.createQueryBuilder(alias);

    if (options?.relations && options.relations.length > 0) {
      options.relations.forEach((relation) => {
        qb.leftJoinAndSelect(`${alias}.${relation}`, relation);
      });
    }

    if (options?.filter) {
      qb = applyFilters(qb, this.ormRepository.target, alias, options.filter);
    }

    if (options?.orderBy) {
      Object.keys(options.orderBy).forEach((key) => {
        qb.addOrderBy(`${alias}.${key}`, options.orderBy[key]);
      });
    }

    if (options?.skip !== undefined) {
      qb.skip(options.skip);
    }

    if (options?.take !== undefined) {
      qb.take(options.take);
    }

    const schemas = await qb.getMany();
    return schemas.map(this.mapSchemaToEntity);
  }

  async edit(
    id: string,
    updateData: Partial<TDomainEntity>,
  ): Promise<TDomainEntity | null> {
    const whereClause: FindOptionsWhere<TSchema> = { id: id as any };

    const existingSchema = await this.ormRepository.findOne({
      where: whereClause,
    });
    if (!existingSchema) {
      throw new NotFoundException(
        `${this.ormRepository.metadata.name} with ID "${id}" not found.`,
      );
    }

    const partialSchemaToUpdate = this.mapPartialEntityToSchema(updateData);
    const mergedSchema = this.ormRepository.merge(
      existingSchema,
      partialSchemaToUpdate as DeepPartial<TSchema>,
    );

    const savedSchema = await this.ormRepository.save(mergedSchema);
    return this.mapSchemaToEntity(savedSchema);
  }
}
