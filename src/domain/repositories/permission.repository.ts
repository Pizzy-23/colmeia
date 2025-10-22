import { PermissionEntity } from '../entities/permission.entity';

export abstract class PermissionRepository {
  abstract findByName(name: string): Promise<PermissionEntity | null>;
  abstract save(permission: PermissionEntity): Promise<PermissionEntity>;
}
