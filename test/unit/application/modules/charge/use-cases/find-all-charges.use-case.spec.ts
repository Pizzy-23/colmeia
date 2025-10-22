import { Test } from '@nestjs/testing';
import { FindAllChargesUseCase } from '@app/modules/charge/use-cases/find-all-charges.use-case';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { ChargeEntity, PaymentMethodEnum } from '@domain/entities/charge.entity';

describe('FindAllChargesUseCase', () => {
  let findAllChargesUseCase: FindAllChargesUseCase;
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
        FindAllChargesUseCase,
        { provide: 'ChargeRepository', useValue: mockChargeRepository },
      ],
    }).compile();

    findAllChargesUseCase = module.get<FindAllChargesUseCase>(FindAllChargesUseCase);
    chargeRepository = module.get<ChargeRepository>('ChargeRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar todas as cobranças', async () => {
      const mockCharges = [
        new ChargeEntity(
          'customer-1',
          100.50,
          'BRL',
          PaymentMethodEnum.PIX,
          'Charge 1',
          {},
        ),
        new ChargeEntity(
          'customer-2',
          200.75,
          'BRL',
          PaymentMethodEnum.CREDIT_CARD,
          'Charge 2',
          { cardData: { number: '4111111111111111' } },
        ),
      ];

      mockChargeRepository.findAll.mockResolvedValue(mockCharges);

      const result = await findAllChargesUseCase.execute();

      expect(result).toEqual(mockCharges);
      expect(chargeRepository.findAll).toHaveBeenCalledWith();
    });

    it('deve retornar array vazio quando não há cobranças', async () => {
      mockChargeRepository.findAll.mockResolvedValue([]);

      const result = await findAllChargesUseCase.execute();

      expect(result).toEqual([]);
      expect(chargeRepository.findAll).toHaveBeenCalledWith();
    });
  });
});
