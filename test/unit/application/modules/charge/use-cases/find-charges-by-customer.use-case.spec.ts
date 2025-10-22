import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FindChargesByCustomerUseCase } from '@app/modules/charge/use-cases/find-charges-by-customer.use-case';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { ChargeEntity, PaymentMethodEnum } from '@domain/entities/charge.entity';
import { CustomerEntity } from '@domain/entities/customer.entity';

describe('FindChargesByCustomerUseCase', () => {
  let findChargesByCustomerUseCase: FindChargesByCustomerUseCase;
  let chargeRepository: ChargeRepository;
  let customerRepository: CustomerRepository;

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

  const mockCustomerRepository = {
    findById: jest.fn(),
    save: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    edit: jest.fn(),
    findByEmail: jest.fn(),
    findByDocument: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FindChargesByCustomerUseCase,
        { provide: 'ChargeRepository', useValue: mockChargeRepository },
        { provide: 'CustomerRepository', useValue: mockCustomerRepository },
      ],
    }).compile();

    findChargesByCustomerUseCase = module.get<FindChargesByCustomerUseCase>(FindChargesByCustomerUseCase);
    chargeRepository = module.get<ChargeRepository>('ChargeRepository');
    customerRepository = module.get<CustomerRepository>('CustomerRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const customerId = 'customer-id';

    it('deve retornar cobranças do cliente quando cliente existe', async () => {
      const mockCustomer = new CustomerEntity();
      mockCustomer.id = customerId;
      mockCustomer.name = 'Test Customer';

      const mockCharges = [
        new ChargeEntity(
          customerId,
          100.50,
          'BRL',
          PaymentMethodEnum.PIX,
          'Charge 1',
          {},
        ),
        new ChargeEntity(
          customerId,
          200.75,
          'BRL',
          PaymentMethodEnum.CREDIT_CARD,
          'Charge 2',
          { cardData: { number: '4111111111111111' } },
        ),
      ];

      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockChargeRepository.findByCustomerId.mockResolvedValue(mockCharges);

      const result = await findChargesByCustomerUseCase.execute(customerId);

      expect(result).toEqual(mockCharges);
      expect(customerRepository.findById).toHaveBeenCalledWith(customerId);
      expect(chargeRepository.findByCustomerId).toHaveBeenCalledWith(customerId);
    });

    it('deve lançar NotFoundException quando cliente não existe', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(findChargesByCustomerUseCase.execute(customerId)).rejects.toThrow(
        NotFoundException,
      );
      expect(customerRepository.findById).toHaveBeenCalledWith(customerId);
      expect(chargeRepository.findByCustomerId).not.toHaveBeenCalled();
    });

    it('deve retornar array vazio quando cliente existe mas não tem cobranças', async () => {
      const mockCustomer = new CustomerEntity();
      mockCustomer.id = customerId;
      mockCustomer.name = 'Test Customer';

      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockChargeRepository.findByCustomerId.mockResolvedValue([]);

      const result = await findChargesByCustomerUseCase.execute(customerId);

      expect(result).toEqual([]);
      expect(customerRepository.findById).toHaveBeenCalledWith(customerId);
      expect(chargeRepository.findByCustomerId).toHaveBeenCalledWith(customerId);
    });
  });
});
