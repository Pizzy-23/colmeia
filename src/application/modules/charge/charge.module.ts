import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargeSchema } from '@infra/database/typeorm/entities/charge.schema';
import { CustomerSchema } from '@infra/database/typeorm/entities/customer.schema';
import { TypeOrmChargeRepository } from '@infra/database/typeorm/repositories/charge-typeorm.repository';
import { TypeOrmCustomerRepository } from '@infra/database/typeorm/repositories/customer-typeorm.repository';
import { ChargeController } from '@infra/http/controllers/charge.controller';
import { CreateChargeUseCase } from './use-cases/create-charge.use-case';
import { FindAllChargesUseCase } from './use-cases/find-all-charges.use-case';
import { FindChargeByIdUseCase } from './use-cases/find-charge-by-id.use-case';
import { FindChargesByCustomerUseCase } from './use-cases/find-charges-by-customer.use-case';
import { UpdateChargeStatusUseCase } from './use-cases/update-charge-status.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargeSchema, CustomerSchema]),
  ],
  controllers: [ChargeController],
  providers: [
    TypeOrmChargeRepository,
    TypeOrmCustomerRepository,
    {
      provide: 'ChargeRepository',
      useExisting: TypeOrmChargeRepository,
    },
    {
      provide: 'CustomerRepository',
      useExisting: TypeOrmCustomerRepository,
    },
    CreateChargeUseCase,
    FindAllChargesUseCase,
    FindChargeByIdUseCase,
    FindChargesByCustomerUseCase,
    UpdateChargeStatusUseCase,
  ],
  exports: [
    CreateChargeUseCase,
    FindAllChargesUseCase,
    FindChargeByIdUseCase,
    FindChargesByCustomerUseCase,
    UpdateChargeStatusUseCase,
  ],
})
export class ChargeModule {}
