import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { ChargeEntity, PaymentMethodEnum } from '@domain/entities/charge.entity';
import { CreateChargeDto } from '../dtos/create-charge.dto';

@Injectable()
export class CreateChargeUseCase {
  constructor(
    @Inject('ChargeRepository')
    private readonly chargeRepository: ChargeRepository,
    @Inject('CustomerRepository')
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(createChargeDto: CreateChargeDto): Promise<ChargeEntity> {
    // Verificar se o cliente existe
    const customer = await this.customerRepository.findById(createChargeDto.customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validar dados específicos por método de pagamento
    this.validatePaymentMethodData(createChargeDto);

    // Criar a cobrança
    const charge = new ChargeEntity(
      createChargeDto.customerId,
      createChargeDto.amount,
      createChargeDto.currency,
      createChargeDto.paymentMethod,
      createChargeDto.description,
      createChargeDto.metadata,
      createChargeDto.expiresAt ? new Date(createChargeDto.expiresAt) : undefined,
    );

    // Definir data de expiração padrão se não fornecida
    if (!charge.expiresAt) {
      charge.expiresAt = this.getDefaultExpirationDate(createChargeDto.paymentMethod);
    }

    return await this.chargeRepository.save(charge);
  }

  private validatePaymentMethodData(createChargeDto: CreateChargeDto): void {
    switch (createChargeDto.paymentMethod) {
      case PaymentMethodEnum.PIX:
        // PIX não requer dados adicionais específicos
        break;
      
      case PaymentMethodEnum.CREDIT_CARD:
        // Validar se tem dados do cartão no metadata
        if (!createChargeDto.metadata?.cardData) {
          throw new BadRequestException('Credit card data is required for credit card payments');
        }
        break;
      
      case PaymentMethodEnum.BANK_SLIP:
        // Boleto requer data de vencimento
        if (!createChargeDto.expiresAt) {
          throw new BadRequestException('Expiration date is required for bank slip payments');
        }
        break;
    }
  }

  private getDefaultExpirationDate(paymentMethod: PaymentMethodEnum): Date {
    const now = new Date();
    
    switch (paymentMethod) {
      case PaymentMethodEnum.PIX:
        // PIX expira em 30 minutos
        return new Date(now.getTime() + 30 * 60 * 1000);
      
      case PaymentMethodEnum.CREDIT_CARD:
        // Cartão de crédito expira em 1 hora
        return new Date(now.getTime() + 60 * 60 * 1000);
      
      case PaymentMethodEnum.BANK_SLIP:
        // Boleto expira em 3 dias
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas padrão
    }
  }
}
