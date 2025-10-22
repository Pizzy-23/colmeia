import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { ChargeEntity } from '@domain/entities/charge.entity';

@Injectable()
export class FindChargesByCustomerUseCase {
  constructor(
    @Inject('ChargeRepository')
    private readonly chargeRepository: ChargeRepository,
    @Inject('CustomerRepository')
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(customerId: string): Promise<ChargeEntity[]> {
    // Verificar se o cliente existe
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return await this.chargeRepository.findByCustomerId(customerId);
  }
}
