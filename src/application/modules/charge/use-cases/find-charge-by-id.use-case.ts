import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { ChargeEntity } from '@domain/entities/charge.entity';

@Injectable()
export class FindChargeByIdUseCase {
  constructor(
    @Inject('ChargeRepository')
    private readonly chargeRepository: ChargeRepository,
  ) {}

  async execute(id: string): Promise<ChargeEntity> {
    const charge = await this.chargeRepository.findById(id);
    if (!charge) {
      throw new NotFoundException('Charge not found');
    }
    return charge;
  }
}
