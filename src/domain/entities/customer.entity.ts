import { BaseEntity } from './base-entity';

export class CustomerEntity extends BaseEntity {
  name: string;
  email: string;
  document: string;
  phone: string;
}

