import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FindChargeByIdUseCase } from '@app/modules/charge/use-cases/find-charge-by-id.use-case';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { ChargeEntity, PaymentMethodEnum } from '@domain/entities/charge.entity';

describe('FindChargeByIdUseCase', () => {
  let findChargeByIdUseCase: FindChargeByIdUseCase;
  let chargeRepository: ChargeRepository;

  const mockChargeRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    edit: jest.fn(),
    findByCustomerId: jest.fn(),
    findByStatus: jest.fn(),
    findByPaymentMethod: jest.fn(),
    findExpiredCharges: jest.fn(),
    findPendingCharges: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FindChargeByIdUseCase,
        { provide: 'ChargeRepository', useValue: mockChargeRepository },
      ],
    }).compile();

    findChargeByIdUseCase = module.get<FindChargeByIdUseCase>(FindChargeByIdUseCase);
    chargeRepository = module.get<ChargeRepository>('ChargeRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const chargeId = 'charge-id';

    it('deve retornar a cobrança quando encontrada', async () => {
      const mockCharge = new ChargeEntity(
        'customer-id',
        100.50,
        'BRL',
        PaymentMethodEnum.PIX,
        'Test charge',
        {},
      );
      mockCharge.id = chargeId;

      mockChargeRepository.findById.mockResolvedValue(mockCharge);

      const result = await findChargeByIdUseCase.execute(chargeId);

      expect(result).toEqual(mockCharge);
      expect(chargeRepository.findById).toHaveBeenCalledWith(chargeId);
    });

    it('deve lançar NotFoundException quando cobrança não existe', async () => {
      mockChargeRepository.findById.mockResolvedValue(null);

      await expect(findChargeByIdUseCase.execute(chargeId)).rejects.toThrow(
        NotFoundException,
      );
      expect(chargeRepository.findById).toHaveBeenCalledWith(chargeId);
    });
  });
});
