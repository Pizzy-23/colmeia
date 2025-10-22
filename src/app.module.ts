import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './application/modules/auth/auth.module';
import { UserModule } from './application/modules/user/user.module';
import { CustomerModule } from './application/modules/customer/customer.module';
import { ChargeModule } from './application/modules/charge/charge.module';
import { typeOrmConfig } from './infrastructure/common/config/typeorm.config';
import { InitDefaultRolesPermissionsUseCase } from './application/modules/user/use-cases/init-default-roles-permissions.use-case';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UserModule,
    CustomerModule,
   ChargeModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly initDefaultRolesPermissionsUseCase: InitDefaultRolesPermissionsUseCase,
  ) {}

  async onModuleInit() {
    await this.initDefaultRolesPermissionsUseCase.onModuleInit();
  }
}
