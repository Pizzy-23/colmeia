import { RoleEnum } from '@domain/constants/roles.enum';
import { UserEntity } from '@domain/entities/user.entity';
import { RoleRepository } from '@domain/repositories/role.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { EncryptionUtil } from '@infra/common/utils/encryption.util';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(
    dto: CreateUserDto,
    assignRole: RoleEnum = RoleEnum.USER,
  ): Promise<UserEntity> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Usuário com este email já existe.');
    }

    const hashedPassword = await EncryptionUtil.hash(dto.password);
    const role = await this.roleRepository.findByName(assignRole);

    if (!role) {
      throw new Error(`Role "${assignRole}" não encontrada.`);
    }

    const newUser = new UserEntity();
    newUser.name = dto.name;
    newUser.email = dto.email;
    newUser.passwordHash = hashedPassword;
    newUser.roles = [role];

    return this.userRepository.save(newUser);
  }
}
