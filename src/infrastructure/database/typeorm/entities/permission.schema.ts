import { Entity, Column } from 'typeorm';
import { BaseTypeOrmSchema } from './base-typeorm.schema';

@Entity('permissions')
export class PermissionSchema extends BaseTypeOrmSchema { 
  @Column({ unique: true })
  name: string;
}