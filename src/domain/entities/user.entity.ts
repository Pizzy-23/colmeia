import { BaseEntity } from './base-entity';

import { RoleEntity } from './role.entity';

export class UserEntity extends BaseEntity {
  name: string;
  email: string;
  passwordHash: string;
  roles: RoleEntity[];
}
