import { RoleEntity } from "@domain/entities/role.entity";
import { BaseRepository } from "./base.repository";

export abstract class RoleRepository extends BaseRepository<RoleEntity> {
  abstract findByName(name: string): Promise<RoleEntity | null>;
  abstract findAllWithPermissions(): Promise<RoleEntity[]>;
}