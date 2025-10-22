import { Injectable, Inject } from '@nestjs/common';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { CustomerEntity } from '@domain/entities/customer.entity';

@Injectable()
export class FindAllCustomersUseCase {
  constructor(
    @Inject(CustomerRepository)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(): Promise<CustomerEntity[]> {
    return await this.customerRepository.findAll();
  }
}
