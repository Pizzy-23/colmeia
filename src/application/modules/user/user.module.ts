import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { FindAllUsersUseCase } from './use-cases/find-all-users.use-case';
import { GetUserByIdUseCase } from './use-cases/get-user-by-id.use-case';
import { InitDefaultRolesPermissionsUseCase } from './use-cases/init-default-roles-permissions.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionRepository } from '@domain/repositories/permission.repository';
import { RoleRepository } from '@domain/repositories/role.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { PermissionSchema } from '@infra/database/typeorm/entities/permission.schema';
import { RoleSchema } from '@infra/database/typeorm/entities/role.schema';
import { UserSchema } from '@infra/database/typeorm/entities/user.schema';
import { TypeOrmPermissionRepository } from '@infra/database/typeorm/repositories/permission-typeorm.repository';
import { TypeOrmRoleRepository } from '@infra/database/typeorm/repositories/role-typeorm.repository';
import { TypeOrmUserRepository } from '@infra/database/typeorm/repositories/user-typeorm.repository';
import { UserController } from '@infra/http/controllers/user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSchema, RoleSchema, PermissionSchema]),
  ],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    FindAllUsersUseCase,
    GetUserByIdUseCase,
    InitDefaultRolesPermissionsUseCase, 
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    { provide: RoleRepository, useClass: TypeOrmRoleRepository },
    { provide: PermissionRepository, useClass: TypeOrmPermissionRepository },
  ],
  exports: [
    UserRepository,
    RoleRepository,
    PermissionRepository,
    InitDefaultRolesPermissionsUseCase, 
  ],
})
export class UserModule {}
