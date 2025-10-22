import { BaseEntity } from './base-entity';

export enum WebhookEventEnum {
  CHARGE_CREATED = 'charge.created',
  CHARGE_UPDATED = 'charge.updated',
  CHARGE_PAID = 'charge.paid',
  CHARGE_FAILED = 'charge.failed',
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',
}

export enum WebhookStatusEnum {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  DISABLED = 'disabled',
}

export class WebhookEntity extends BaseEntity {
  public url: string;
  public events: WebhookEventEnum[];
  public status: WebhookStatusEnum;
  public secret: string;
  public retryCount: number = 0;
  public lastDeliveryAt?: Date;
  public lastError?: string;

  constructor(
    url: string,
    events: WebhookEventEnum[],
    secret: string,
  ) {
    super();
    this.url = url;
    this.events = events;
    this.secret = secret;
    this.status = WebhookStatusEnum.PENDING;
  }

  public canDeliver(): boolean {
    return this.status === WebhookStatusEnum.PENDING || 
           this.status === WebhookStatusEnum.FAILED;
  }

  public markAsDelivered(): void {
    this.status = WebhookStatusEnum.DELIVERED;
    this.lastDeliveryAt = new Date();
    this.retryCount = 0;
    this.lastError = undefined;
  }

  public markAsFailed(error: string): void {
    this.status = WebhookStatusEnum.FAILED;
    this.lastError = error;
    this.retryCount++;
  }

  public disable(): void {
    this.status = WebhookStatusEnum.DISABLED;
  }
}
