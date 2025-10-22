import { Snowflake } from 'nodejs-snowflake';

const uid = new Snowflake();

export function generateId(): string {
  return uid.getUniqueID().toString();
}
