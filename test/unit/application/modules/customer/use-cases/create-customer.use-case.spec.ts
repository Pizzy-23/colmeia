import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateCustomerUseCase } from '@app/modules/customer/use-cases/create-customer.use-case';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { CreateCustomerDto } from '@app/modules/customer/dtos/create-customer.dto';
import { CustomerEntity } from '@domain/entities/customer.entity';

describe('CreateCustomerUseCase', () => {
  let createCustomerUseCase: CreateCustomerUseCase;
  let customerRepository: CustomerRepository;

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
        CreateCustomerUseCase,
        { provide: CustomerRepository, useValue: mockCustomerRepository },
      ],
    }).compile();

    createCustomerUseCase = module.get<CreateCustomerUseCase>(CreateCustomerUseCase);
    customerRepository = module.get<CustomerRepository>(CustomerRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCreateCustomerDto: CreateCustomerDto = {
      name: 'Test Customer',
      email: 'test@example.com',
      document: '12345678901',
      phone: '+5511999999999',
    };

    it('deve criar um cliente com sucesso', async () => {
      const expectedCustomer = new CustomerEntity();
      expectedCustomer.name = validCreateCustomerDto.name;
      expectedCustomer.email = validCreateCustomerDto.email;
      expectedCustomer.document = validCreateCustomerDto.document;
      expectedCustomer.phone = validCreateCustomerDto.phone;

      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerRepository.findByDocument.mockResolvedValue(null);
      mockCustomerRepository.save.mockResolvedValue(expectedCustomer);

      const result = await createCustomerUseCase.execute(validCreateCustomerDto);

      expect(result).toEqual(expectedCustomer);
      expect(customerRepository.findByEmail).toHaveBeenCalledWith(validCreateCustomerDto.email);
      expect(customerRepository.findByDocument).toHaveBeenCalledWith(validCreateCustomerDto.document);
      expect(customerRepository.save).toHaveBeenCalledWith(expect.any(CustomerEntity));
    });

    it('deve lançar ConflictException quando email já existe', async () => {
      const existingCustomer = new CustomerEntity();
      existingCustomer.email = validCreateCustomerDto.email;

      mockCustomerRepository.findByEmail.mockResolvedValue(existingCustomer);

      await expect(createCustomerUseCase.execute(validCreateCustomerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(customerRepository.findByEmail).toHaveBeenCalledWith(validCreateCustomerDto.email);
      expect(customerRepository.findByDocument).not.toHaveBeenCalled();
      expect(customerRepository.save).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando documento já existe', async () => {
      const existingCustomer = new CustomerEntity();
      existingCustomer.document = validCreateCustomerDto.document;

      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerRepository.findByDocument.mockResolvedValue(existingCustomer);

      await expect(createCustomerUseCase.execute(validCreateCustomerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(customerRepository.findByEmail).toHaveBeenCalledWith(validCreateCustomerDto.email);
      expect(customerRepository.findByDocument).toHaveBeenCalledWith(validCreateCustomerDto.document);
      expect(customerRepository.save).not.toHaveBeenCalled();
    });

    it('deve verificar email antes de documento', async () => {
      const existingCustomer = new CustomerEntity();
      existingCustomer.email = validCreateCustomerDto.email;

      mockCustomerRepository.findByEmail.mockResolvedValue(existingCustomer);

      await expect(createCustomerUseCase.execute(validCreateCustomerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(customerRepository.findByEmail).toHaveBeenCalledWith(validCreateCustomerDto.email);
      expect(customerRepository.findByDocument).not.toHaveBeenCalled();
    });
  });
});
