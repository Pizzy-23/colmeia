import { JwtPayloadDto } from '@app/dtos/jwt-payload.dto';
import { RoleEntity } from '@domain/entities/role.entity';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRepository } from '@domain/repositories/user.repository';
import { jwtConfig } from '@infra/common/config/jwt.config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: JwtPayloadDto): Promise<UserEntity | null> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      return null;
    }
    user.roles = payload.roles.map((roleName) => {
      const role = new RoleEntity();
      role.name = roleName;
      return role;
    });
    return user;
  }
}
