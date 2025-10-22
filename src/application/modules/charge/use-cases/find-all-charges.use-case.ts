import { Injectable, Inject } from '@nestjs/common';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { ChargeEntity } from '@domain/entities/charge.entity';

@Injectable()
export class FindAllChargesUseCase {
  constructor(
    @Inject('ChargeRepository')
    private readonly chargeRepository: ChargeRepository,
  ) {}

  async execute(): Promise<ChargeEntity[]> {
    return await this.chargeRepository.findAll();
  }
}
