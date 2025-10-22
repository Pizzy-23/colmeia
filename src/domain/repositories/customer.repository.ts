import { CustomerEntity } from '../entities/customer.entity';
import { BaseRepository } from './base.repository';

export abstract class CustomerRepository extends BaseRepository<CustomerEntity> {
  abstract findByEmail(email: string): Promise<CustomerEntity | null>;
  abstract findByDocument(document: string): Promise<CustomerEntity | null>;
}

