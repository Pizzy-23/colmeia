import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dtos/login.dto';
import { JwtPayloadDto } from '@app/dtos/jwt-payload.dto';
import { UserRepository } from '@domain/repositories/user.repository';
import { EncryptionUtil } from '@infra/common/utils/encryption.util';


@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (
      !user ||
      !(await EncryptionUtil.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const payload: JwtPayloadDto = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.name) as JwtPayloadDto['roles'],
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
