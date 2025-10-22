import { BaseRepository } from './base.repository';
import { WebhookEntity } from '../entities/webhook.entity';
import { WebhookEventEnum } from '../entities/webhook.entity';

export abstract class WebhookRepository extends BaseRepository<WebhookEntity> {
  abstract findByEvent(event: WebhookEventEnum): Promise<WebhookEntity[]>;
  abstract findByUrl(url: string): Promise<WebhookEntity | null>;
  abstract findActiveWebhooks(): Promise<WebhookEntity[]>;
}
