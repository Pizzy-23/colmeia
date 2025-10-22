import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ChargeStatusEnum } from '@domain/entities/charge.entity';

export class UpdateChargeStatusDto {
  @IsEnum(ChargeStatusEnum)
  status: ChargeStatusEnum;

  @IsOptional()
  @IsString()
  failureReason?: string;
}
