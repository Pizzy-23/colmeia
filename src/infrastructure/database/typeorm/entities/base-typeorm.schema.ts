import {
  BaseEntity as TypeOrmBaseEntity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { generateId } from '@infra/common/utils/generate-id';

@Exclude()
export abstract class BaseTypeOrmSchema extends TypeOrmBaseEntity {
  @Expose()
  @PrimaryColumn('varchar', { length: 36 }) 
  id: string;

  @Expose()
  @CreateDateColumn({
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Expose()
  @UpdateDateColumn({
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @BeforeInsert()
  generateIdValue() {
    if (!this.id) { 
      this.id = generateId();
    }
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
    if (!this.updatedAt) {
      this.updatedAt = new Date();
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  updateTimestamps() {
      this.updatedAt = new Date();
  }
}