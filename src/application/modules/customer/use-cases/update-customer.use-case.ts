import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { CustomerEntity } from '@domain/entities/customer.entity';
import { UpdateCustomerDto } from '../dtos/update-customer.dto';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CustomerRepository)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Atualizar apenas os campos fornecidos
    if (updateCustomerDto.name !== undefined) {
      customer.name = updateCustomerDto.name;
    }
    if (updateCustomerDto.email !== undefined) {
      customer.email = updateCustomerDto.email;
    }
    if (updateCustomerDto.document !== undefined) {
      customer.document = updateCustomerDto.document;
    }
    if (updateCustomerDto.phone !== undefined) {
      customer.phone = updateCustomerDto.phone;
    }

    return await this.customerRepository.save(customer);
  }
}
