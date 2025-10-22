import { CustomerEntity } from '@domain/entities/customer.entity';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { ConflictException, Injectable, Inject } from '@nestjs/common';
import { CreateCustomerDto } from '../dtos/create-customer.dto';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CustomerRepository)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(dto: CreateCustomerDto): Promise<CustomerEntity> {
    // Verificar se já existe um cliente com o mesmo email
    const existingCustomerByEmail = await this.customerRepository.findByEmail(dto.email);
    if (existingCustomerByEmail) {
      throw new ConflictException('Cliente com este email já existe.');
    }

    // Verificar se já existe um cliente com o mesmo documento
    const existingCustomerByDocument = await this.customerRepository.findByDocument(dto.document);
    if (existingCustomerByDocument) {
      throw new ConflictException('Cliente com este documento já existe.');
    }

    // Criar nova entidade de cliente
    const newCustomer = new CustomerEntity();
    newCustomer.name = dto.name;
    newCustomer.email = dto.email;
    newCustomer.document = dto.document;
    newCustomer.phone = dto.phone;

    return this.customerRepository.save(newCustomer);
  }
}

