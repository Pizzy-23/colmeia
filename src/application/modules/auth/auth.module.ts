import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '@infra/http/controllers/auth.controller';
import { jwtConfig } from '@infra/common/config/jwt.config';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LoginUseCase } from './use-cases/login.use-case';


@Module({
  imports: [
    UserModule, 
    PassportModule,
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: { expiresIn: jwtConfig.expiresIn },
    }),
  ],
  providers: [
    JwtStrategy,
    LoginUseCase,
  ],
  controllers: [AuthController],
  exports: [
    JwtModule,
  ],
})
export class AuthModule {}