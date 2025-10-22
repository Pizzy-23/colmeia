import { Entity, Column } from 'typeorm';
import { BaseTypeOrmSchema } from './base-typeorm.schema';

@Entity('customers')
export class CustomerSchema extends BaseTypeOrmSchema {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  document: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;
}

