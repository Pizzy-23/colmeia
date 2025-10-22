import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateChargeUseCase } from '@app/modules/charge/use-cases/create-charge.use-case';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { CreateChargeDto } from '@app/modules/charge/dtos/create-charge.dto';
import { ChargeEntity, PaymentMethodEnum } from '@domain/entities/charge.entity';
import { CustomerEntity } from '@domain/entities/customer.entity';

describe('CreateChargeUseCase', () => {
  let createChargeUseCase: CreateChargeUseCase;
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
        CreateChargeUseCase,
        { provide: 'ChargeRepository', useValue: mockChargeRepository },
        { provide: 'CustomerRepository', useValue: mockCustomerRepository },
      ],
    }).compile();

    createChargeUseCase = module.get<CreateChargeUseCase>(CreateChargeUseCase);
    chargeRepository = module.get<ChargeRepository>('ChargeRepository');
    customerRepository = module.get<CustomerRepository>('CustomerRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCreateChargeDto: CreateChargeDto = {
      customerId: 'customer-id',
      amount: 100.50,
      currency: 'BRL',
      paymentMethod: PaymentMethodEnum.PIX,
      description: 'Test charge',
      metadata: {},
    };

    const mockCustomer = new CustomerEntity();
    mockCustomer.id = 'customer-id';
    mockCustomer.name = 'Test Customer';
    mockCustomer.email = 'test@example.com';

    it('deve criar uma cobrança PIX com sucesso', async () => {
      const expectedCharge = new ChargeEntity(
        validCreateChargeDto.customerId,
        validCreateChargeDto.amount,
        validCreateChargeDto.currency,
        validCreateChargeDto.paymentMethod,
        validCreateChargeDto.description,
        validCreateChargeDto.metadata,
      );

      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockChargeRepository.save.mockResolvedValue(expectedCharge);

      const result = await createChargeUseCase.execute(validCreateChargeDto);

      expect(result).toEqual(expectedCharge);
      expect(customerRepository.findById).toHaveBeenCalledWith(validCreateChargeDto.customerId);
      expect(chargeRepository.save).toHaveBeenCalledWith(expect.any(ChargeEntity));
    });

    it('deve criar uma cobrança de cartão de crédito com dados do cartão', async () => {
      const creditCardDto: CreateChargeDto = {
        ...validCreateChargeDto,
        paymentMethod: PaymentMethodEnum.CREDIT_CARD,
        metadata: {
          cardData: {
            number: '4111111111111111',
            cvv: '123',
            expiryMonth: '12',
            expiryYear: '2025',
            holderName: 'Test Holder',
          },
        },
      };

      const expectedCharge = new ChargeEntity(
        creditCardDto.customerId,
        creditCardDto.amount,
        creditCardDto.currency,
        creditCardDto.paymentMethod,
        creditCardDto.description,
        creditCardDto.metadata,
      );

      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockChargeRepository.save.mockResolvedValue(expectedCharge);

      const result = await createChargeUseCase.execute(creditCardDto);

      expect(result).toEqual(expectedCharge);
      expect(customerRepository.findById).toHaveBeenCalledWith(creditCardDto.customerId);
      expect(chargeRepository.save).toHaveBeenCalledWith(expect.any(ChargeEntity));
    });

    it('deve criar uma cobrança de boleto com data de vencimento', async () => {
      const bankSlipDto: CreateChargeDto = {
        ...validCreateChargeDto,
        paymentMethod: PaymentMethodEnum.BANK_SLIP,
        expiresAt: '2024-12-31T23:59:59.999Z',
      };

      const expectedCharge = new ChargeEntity(
        bankSlipDto.customerId,
        bankSlipDto.amount,
        bankSlipDto.currency,
        bankSlipDto.paymentMethod,
        bankSlipDto.description,
        bankSlipDto.metadata,
        new Date(bankSlipDto.expiresAt!),
      );

      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockChargeRepository.save.mockResolvedValue(expectedCharge);

      const result = await createChargeUseCase.execute(bankSlipDto);

      expect(result).toEqual(expectedCharge);
      expect(customerRepository.findById).toHaveBeenCalledWith(bankSlipDto.customerId);
      expect(chargeRepository.save).toHaveBeenCalledWith(expect.any(ChargeEntity));
    });

    it('deve definir data de expiração padrão para PIX se não fornecida', async () => {
      const pixDto: CreateChargeDto = {
        ...validCreateChargeDto,
        paymentMethod: PaymentMethodEnum.PIX,
      };

      const expectedCharge = new ChargeEntity(
        pixDto.customerId,
        pixDto.amount,
        pixDto.currency,
        pixDto.paymentMethod,
        pixDto.description,
        pixDto.metadata,
      );

      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockChargeRepository.save.mockResolvedValue(expectedCharge);

      const result = await createChargeUseCase.execute(pixDto);

      expect(result).toEqual(expectedCharge);
      expect(chargeRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        expiresAt: expect.any(Date),
      }));
    });

    it('deve lançar NotFoundException quando cliente não existe', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(createChargeUseCase.execute(validCreateChargeDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(customerRepository.findById).toHaveBeenCalledWith(validCreateChargeDto.customerId);
      expect(chargeRepository.save).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException para cartão de crédito sem dados do cartão', async () => {
      const creditCardDto: CreateChargeDto = {
        ...validCreateChargeDto,
        paymentMethod: PaymentMethodEnum.CREDIT_CARD,
        metadata: {},
      };

      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);

      await expect(createChargeUseCase.execute(creditCardDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(customerRepository.findById).toHaveBeenCalledWith(creditCardDto.customerId);
      expect(chargeRepository.save).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException para boleto sem data de vencimento', async () => {
      const bankSlipDto: CreateChargeDto = {
        ...validCreateChargeDto,
        paymentMethod: PaymentMethodEnum.BANK_SLIP,
      };

      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);

      await expect(createChargeUseCase.execute(bankSlipDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(customerRepository.findById).toHaveBeenCalledWith(bankSlipDto.customerId);
      expect(chargeRepository.save).not.toHaveBeenCalled();
    });
  });
});
