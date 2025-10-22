import { PermissionEntity } from '@domain/entities/permission.entity';
import { RoleEntity } from '@domain/entities/role.entity';
import { RoleRepository } from '@domain/repositories/role.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { PermissionSchema } from '../entities/permission.schema';
import { RoleSchema } from '../entities/role.schema';
import { BaseTypeOrmRepository } from './base-typeorm.repository';

@Injectable()
export class TypeOrmRoleRepository
  extends BaseTypeOrmRepository<RoleEntity, RoleSchema>
  implements RoleRepository
{
  constructor(
    @InjectRepository(RoleSchema)
    protected readonly ormRepository: Repository<RoleSchema>,
  ) {
    super(ormRepository);
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    const roleSchema = await this.ormRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
    return roleSchema ? this.mapSchemaToEntity(roleSchema) : null;
  }

  async findAllWithPermissions(): Promise<RoleEntity[]> {
    return this.findAll({ relations: ['permissions'] });
  }

  protected mapSchemaToEntity(schema: RoleSchema): RoleEntity {
    const entity = new RoleEntity();
    entity.id = schema.id;
    entity.name = schema.name;
    entity.createdAt = schema.createdAt;
    entity.updatedAt = schema.updatedAt;
    entity.permissions = schema.permissions
      ? schema.permissions.map((permSchema) => {
          const permEntity = new PermissionEntity();
          permEntity.id = permSchema.id;
          permEntity.name = permSchema.name;
          permEntity.createdAt = permSchema.createdAt;
          permEntity.updatedAt = permSchema.updatedAt;
          return permEntity;
        })
      : [];
    return entity;
  }

  protected mapEntityToSchema(entity: RoleEntity): RoleSchema {
    const schema = new RoleSchema();
    if (entity.id) schema.id = entity.id;
    schema.name = entity.name;
    if (entity.createdAt) schema.createdAt = entity.createdAt;
    if (entity.updatedAt) schema.updatedAt = entity.updatedAt;
    schema.permissions = entity.permissions
      ? entity.permissions.map((permEntity) => {
          const permSchema = new PermissionSchema();
          if (permEntity.id) permSchema.id = permEntity.id;
          permSchema.name = permEntity.name;
          return permSchema;
        })
      : [];
    return schema;
  }

  protected mapPartialEntityToSchema(
    partialEntity: Partial<RoleEntity>,
  ): DeepPartial<RoleSchema> {
    const partialSchema: DeepPartial<RoleSchema> = {};
    if (partialEntity.name !== undefined)
      partialSchema.name = partialEntity.name;
    if (partialEntity.permissions !== undefined) {
      partialSchema.permissions = partialEntity.permissions.map((p) => {
        const permSchema = new PermissionSchema();
        if (p.id) permSchema.id = p.id;
        permSchema.name = p.name;
        return permSchema;
      });
    }
    return partialSchema;
  }
}
