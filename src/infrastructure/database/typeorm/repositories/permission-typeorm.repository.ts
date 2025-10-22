import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PermissionEntity } from '../../../../domain/entities/permission.entity';
import { PermissionRepository } from '../../../../domain/repositories/permission.repository';
import { PermissionSchema } from '../entities/permission.schema';

@Injectable()
export class TypeOrmPermissionRepository implements PermissionRepository {
  constructor(
    @InjectRepository(PermissionSchema)
    private readonly ormRepository: Repository<PermissionSchema>,
  ) {}

  async findByName(name: string): Promise<PermissionEntity | null> {
    const permissionSchema = await this.ormRepository.findOne({ where: { name } });
    return permissionSchema ? this.mapSchemaToEntity(permissionSchema) : null;
  }

  async save(permission: PermissionEntity): Promise<PermissionEntity> {
    const permissionSchema = this.mapEntityToSchema(permission);
    const savedSchema = await this.ormRepository.save(permissionSchema);
    return this.mapSchemaToEntity(savedSchema);
  }

  private mapSchemaToEntity(schema: PermissionSchema): PermissionEntity {
    const entity = new PermissionEntity();
    entity.id = schema.id;
    entity.name = schema.name;
    entity.createdAt = schema.createdAt;
    entity.updatedAt = schema.updatedAt;
    return entity;
  }

  private mapEntityToSchema(entity: PermissionEntity): PermissionSchema {
    const schema = new PermissionSchema();
    schema.id = entity.id;
    schema.name = entity.name;
    schema.createdAt = entity.createdAt;
    schema.updatedAt = entity.updatedAt;
    return schema;
  }
}
