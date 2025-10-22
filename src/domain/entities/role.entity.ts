import { BaseEntity } from './base-entity';

import { PermissionEntity } from './permission.entity';

export class RoleEntity extends BaseEntity {
  name: string;
  permissions: PermissionEntity[];
}
