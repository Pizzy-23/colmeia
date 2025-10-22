import { RoleEnum } from '../../domain/constants/roles.enum';

export interface JwtPayloadDto {
  sub: string;
  email: string;
  roles: RoleEnum[];
}
