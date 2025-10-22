import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { ChargeEntity, ChargeStatusEnum } from '@domain/entities/charge.entity';
import { UpdateChargeStatusDto } from '../dtos/update-charge-status.dto';

@Injectable()
export class UpdateChargeStatusUseCase {
  constructor(
    @Inject('ChargeRepository')
    private readonly chargeRepository: ChargeRepository,
  ) {}

  async execute(id: string, updateChargeStatusDto: UpdateChargeStatusDto): Promise<ChargeEntity> {
    const charge = await this.chargeRepository.findById(id);
    if (!charge) {
      throw new NotFoundException('Charge not found');
    }

    // Validar se a transição de status é válida
    this.validateStatusTransition(charge.status, updateChargeStatusDto.status);

    // Atualizar o status
    switch (updateChargeStatusDto.status) {
      case ChargeStatusEnum.PAID:
        charge.markAsPaid();
        break;
      case ChargeStatusEnum.FAILED:
        charge.markAsFailed(updateChargeStatusDto.failureReason);
        break;
      case ChargeStatusEnum.EXPIRED:
        charge.markAsExpired();
        break;
      case ChargeStatusEnum.CANCELLED:
        charge.cancel();
        break;
      default:
        charge.status = updateChargeStatusDto.status;
    }

    return await this.chargeRepository.save(charge);
  }

  private validateStatusTransition(currentStatus: ChargeStatusEnum, newStatus: ChargeStatusEnum): void {
    // Não permitir mudanças de status já finalizados
    if (currentStatus === ChargeStatusEnum.PAID) {
      throw new BadRequestException('Cannot change status of a paid charge');
    }

    if (currentStatus === ChargeStatusEnum.CANCELLED) {
      throw new BadRequestException('Cannot change status of a cancelled charge');
    }

    // Não permitir voltar para pendente
    if (newStatus === ChargeStatusEnum.PENDING && currentStatus !== ChargeStatusEnum.PENDING) {
      throw new BadRequestException('Cannot revert to pending status');
    }
  }
}
