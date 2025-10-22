import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CustomerRepository } from '@domain/repositories/customer.repository';

@Injectable()
export class DeleteCustomerUseCase {
  constructor(
    @Inject(CustomerRepository)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.customerRepository.delete(id);
  }
}
