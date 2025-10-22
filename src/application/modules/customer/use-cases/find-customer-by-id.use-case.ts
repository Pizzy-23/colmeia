import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { CustomerEntity } from '@domain/entities/customer.entity';

@Injectable()
export class FindCustomerByIdUseCase {
  constructor(
    @Inject(CustomerRepository)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(id: string): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }
}
