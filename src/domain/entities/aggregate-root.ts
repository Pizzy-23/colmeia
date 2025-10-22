import { DomainEvent } from '@domain/domain-events/domain-event';
import { BaseEntity, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class AggregateRoot extends BaseEntity {
  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  domainEvents: DomainEvent[] = [];
}
