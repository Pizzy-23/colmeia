import { RoleEnum } from '@domain/constants/roles.enum';
import { PermissionEntity } from '@domain/entities/permission.entity';
import { RoleEntity } from '@domain/entities/role.entity';
import { PermissionRepository } from '@domain/repositories/permission.repository';
import { RoleRepository } from '@domain/repositories/role.repository';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
@Injectable()
export class InitDefaultRolesPermissionsUseCase implements OnModuleInit {
  private readonly logger = new Logger(InitDefaultRolesPermissionsUseCase.name);

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async onModuleInit() {
    await this.initRolesAndPermissions();
  }

  private async initRolesAndPermissions() {
    this.logger.log('Inicializando roles e permissões padrão...');

    const allPermissions = [
      'user_read',
      'user_create',
      'user_update',
      'user_delete',
      'role_read',
      'role_create',
      'role_update',
      'role_delete',
      'product_read',
      'product_create',
    ];

    const savedPermissions: PermissionEntity[] = [];
    for (const pName of allPermissions) {
      let permission = await this.permissionRepository.findByName(pName);
      if (!permission) {
        permission = new PermissionEntity();
        permission.name = pName;
        permission = await this.permissionRepository.save(permission);
        this.logger.debug(`Permissão criada: ${pName}`);
      }
      savedPermissions.push(permission);
    }

    const adminRolePermissions = savedPermissions;
    const userRolePermissions = savedPermissions.filter(
      (p) =>
        p.name.startsWith('user_read') || p.name.startsWith('product_read'),
    );
    const visitorRolePermissions = savedPermissions.filter(
      (p) => p.name === 'product_read',
    );

    const rolesToCreate = [
      { name: RoleEnum.ADMIN, permissions: adminRolePermissions },
      { name: RoleEnum.USER, permissions: userRolePermissions },
      { name: RoleEnum.VISITOR, permissions: visitorRolePermissions },
    ];

    for (const roleDef of rolesToCreate) {
      let role = await this.roleRepository.findByName(roleDef.name);
      if (!role) {
        role = new RoleEntity();
        role.name = roleDef.name;
        role.permissions = roleDef.permissions;
        await this.roleRepository.save(role);
        this.logger.debug(`Role criada: ${roleDef.name}`);
      } else {
        role.permissions = roleDef.permissions;
        await this.roleRepository.save(role);
        this.logger.debug(
          `Permissões atualizadas para a role: ${roleDef.name}`,
        );
      }
    }

    this.logger.log('Roles e permissões padrão inicializadas.');
  }

}
