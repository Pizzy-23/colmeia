import { AggregateRoot } from "@domain/entities/aggregate-root";
import { Injectable } from "@nestjs/common";
import { DataSource, InsertEvent, UpdateEvent, RemoveEvent } from "typeorm";
import { EntitySubscriberInterface } from "typeorm/subscriber/EntitySubscriberInterface";
import { DomainEventsPublisher } from "./domain-events-publisher";
import { DomainEventsStore } from "./domain-events-store";

@Injectable()
export class DomainEventsSubscriber
  implements EntitySubscriberInterface<AggregateRoot>
{
  constructor(
    dataSource: DataSource,
    private readonly domainEvents: DomainEventsStore,
    private readonly publisher: DomainEventsPublisher,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return AggregateRoot;
  }

  async afterInsert(event: InsertEvent<AggregateRoot>) {
    this.domainEvents.collect(event.entity);
  }

  async afterUpdate(event: UpdateEvent<AggregateRoot>) {
    this.domainEvents.collect(event.entity as AggregateRoot);
  }

  async afterRemove(event: RemoveEvent<AggregateRoot>) {
    this.domainEvents.collect(event.entity);
  }

  async afterTransactionCommit() {
    await this.publisher.publishEvents(this.domainEvents.get());
    this.domainEvents.clear();
  }

  async afterTransactionRollback() {
    this.domainEvents.clear();
  }
}
