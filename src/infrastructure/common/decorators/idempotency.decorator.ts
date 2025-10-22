import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_KEY = 'idempotency';

export const Idempotency = (key?: string) => SetMetadata(IDEMPOTENCY_KEY, key);
