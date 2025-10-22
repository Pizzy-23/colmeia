import { Module } from '@nestjs/common';
import { CreateCustomerUseCase } from './use-cases/create-customer.use-case';
import { FindAllCustomersUseCase } from './use-cases/find-all-customers.use-case';
import { FindCustomerByIdUseCase } from './use-cases/find-customer-by-id.use-case';
import { UpdateCustomerUseCase } from './use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from './use-cases/delete-customer.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { CustomerSchema } from '@infra/database/typeorm/entities/customer.schema';
import { TypeOrmCustomerRepository } from '@infra/database/typeorm/repositories/customer-typeorm.repository';
import { CustomerController } from '@infra/http/controllers/customer.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerSchema]),
  ],
  controllers: [CustomerController],
  providers: [
    TypeOrmCustomerRepository,
    {
      provide: CustomerRepository,
      useExisting: TypeOrmCustomerRepository,
    },
    CreateCustomerUseCase,
    FindAllCustomersUseCase,
    FindCustomerByIdUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
  ],
  exports: [
    CustomerRepository,
    CreateCustomerUseCase,
    FindAllCustomersUseCase,
    FindCustomerByIdUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
  ],
})
export class CustomerModule {}

