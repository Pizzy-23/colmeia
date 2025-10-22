import { Injectable, Logger } from '@nestjs/common';
import { WebhookRepository } from '@domain/repositories/webhook.repository';
import { WebhookEventEnum } from '@domain/entities/webhook.entity';
import { createHmac } from 'crypto';

@Injectable()
export class SendWebhookUseCase {
  private readonly logger = new Logger(SendWebhookUseCase.name);

  constructor(
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async execute(event: WebhookEventEnum, data: any): Promise<void> {
    try {
      const webhooks = await this.webhookRepository.findByEvent(event);
      
      if (webhooks.length === 0) {
        this.logger.log(`No webhooks found for event: ${event}`);
        return;
      }

      const promises = webhooks
        .filter(webhook => webhook.canDeliver())
        .map(webhook => this.deliverWebhook(webhook, event, data));

      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error(`Error sending webhooks for event ${event}:`, error);
    }
  }

  private async deliverWebhook(webhook: any, event: WebhookEventEnum, data: any): Promise<void> {
    try {
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };

      const signature = this.generateSignature(JSON.stringify(payload), webhook.secret);
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'User-Agent': 'Colmeia-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        timeout: 10000, // 10 seconds timeout
      });

      if (response.ok) {
        webhook.markAsDelivered();
        this.logger.log(`Webhook delivered successfully to ${webhook.url}`);
      } else {
        webhook.markAsFailed(`HTTP ${response.status}: ${response.statusText}`);
        this.logger.warn(`Webhook delivery failed to ${webhook.url}: ${response.status}`);
      }

      await this.webhookRepository.save(webhook);
    } catch (error) {
      webhook.markAsFailed(error.message);
      this.logger.error(`Webhook delivery error to ${webhook.url}:`, error);
      await this.webhookRepository.save(webhook);
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }
}
