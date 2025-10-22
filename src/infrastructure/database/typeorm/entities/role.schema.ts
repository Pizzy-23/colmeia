import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { PermissionSchema } from './permission.schema';
import { BaseTypeOrmSchema } from './base-typeorm.schema';
@Entity('roles')
export class RoleSchema extends BaseTypeOrmSchema {
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => PermissionSchema, { cascade: true, eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: PermissionSchema[];
}
