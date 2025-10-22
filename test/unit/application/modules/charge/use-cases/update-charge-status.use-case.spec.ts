import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateChargeStatusUseCase } from '@app/modules/charge/use-cases/update-charge-status.use-case';
import { ChargeRepository } from '@domain/repositories/charge.repository';
import { ChargeEntity, PaymentMethodEnum, ChargeStatusEnum } from '@domain/entities/charge.entity';
import { UpdateChargeStatusDto } from '@app/modules/charge/dtos/update-charge-status.dto';

describe('UpdateChargeStatusUseCase', () => {
  let updateChargeStatusUseCase: UpdateChargeStatusUseCase;
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
        UpdateChargeStatusUseCase,
        { provide: 'ChargeRepository', useValue: mockChargeRepository },
      ],
    }).compile();

    updateChargeStatusUseCase = module.get<UpdateChargeStatusUseCase>(UpdateChargeStatusUseCase);
    chargeRepository = module.get<ChargeRepository>('ChargeRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const chargeId = 'charge-id';

    it('deve atualizar status para PAID com sucesso', async () => {
      const mockCharge = new ChargeEntity(
        'customer-id',
        100.50,
        'BRL',
        PaymentMethodEnum.PIX,
        'Test charge',
        {},
      );
      mockCharge.id = chargeId;
      mockCharge.status = ChargeStatusEnum.PENDING;

      const updateDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.PAID,
      };

      const updatedCharge = { ...mockCharge, status: ChargeStatusEnum.PAID, paidAt: new Date() };

      mockChargeRepository.findById.mockResolvedValue(mockCharge);
      mockChargeRepository.save.mockResolvedValue(updatedCharge);

      const result = await updateChargeStatusUseCase.execute(chargeId, updateDto);

      expect(result).toEqual(updatedCharge);
      expect(chargeRepository.findById).toHaveBeenCalledWith(chargeId);
      expect(chargeRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        status: ChargeStatusEnum.PAID,
      }));
    });

    it('deve atualizar status para FAILED com motivo', async () => {
      const mockCharge = new ChargeEntity(
        'customer-id',
        100.50,
        'BRL',
        PaymentMethodEnum.PIX,
        'Test charge',
        {},
      );
      mockCharge.id = chargeId;
      mockCharge.status = ChargeStatusEnum.PENDING;

      const updateDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.FAILED,
        failureReason: 'Insufficient funds',
      };

      const updatedCharge = { 
        ...mockCharge, 
        status: ChargeStatusEnum.FAILED, 
        failureReason: 'Insufficient funds' 
      };

      mockChargeRepository.findById.mockResolvedValue(mockCharge);
      mockChargeRepository.save.mockResolvedValue(updatedCharge);

      const result = await updateChargeStatusUseCase.execute(chargeId, updateDto);

      expect(result).toEqual(updatedCharge);
      expect(chargeRepository.findById).toHaveBeenCalledWith(chargeId);
      expect(chargeRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        status: ChargeStatusEnum.FAILED,
        failureReason: 'Insufficient funds',
      }));
    });

    it('deve atualizar status para EXPIRED', async () => {
      const mockCharge = new ChargeEntity(
        'customer-id',
        100.50,
        'BRL',
        PaymentMethodEnum.PIX,
        'Test charge',
        {},
      );
      mockCharge.id = chargeId;
      mockCharge.status = ChargeStatusEnum.PENDING;

      const updateDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.EXPIRED,
      };

      const updatedCharge = { ...mockCharge, status: ChargeStatusEnum.EXPIRED };

      mockChargeRepository.findById.mockResolvedValue(mockCharge);
      mockChargeRepository.save.mockResolvedValue(updatedCharge);

      const result = await updateChargeStatusUseCase.execute(chargeId, updateDto);

      expect(result).toEqual(updatedCharge);
      expect(chargeRepository.findById).toHaveBeenCalledWith(chargeId);
      expect(chargeRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        status: ChargeStatusEnum.EXPIRED,
      }));
    });

    it('deve atualizar status para CANCELLED', async () => {
      const mockCharge = new ChargeEntity(
        'customer-id',
        100.50,
        'BRL',
        PaymentMethodEnum.PIX,
        'Test charge',
        {},
      );
      mockCharge.id = chargeId;
      mockCharge.status = ChargeStatusEnum.PENDING;

      const updateDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.CANCELLED,
      };

      const updatedCharge = { ...mockCharge, status: ChargeStatusEnum.CANCELLED };

      mockChargeRepository.findById.mockResolvedValue(mockCharge);
      mockChargeRepository.save.mockResolvedValue(updatedCharge);

      const result = await updateChargeStatusUseCase.execute(chargeId, updateDto);

      expect(result).toEqual(updatedCharge);
      expect(chargeRepository.findById).toHaveBeenCalledWith(chargeId);
      expect(chargeRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        status: ChargeStatusEnum.CANCELLED,
      }));
    });

    it('deve lançar NotFoundException quando cobrança não existe', async () => {
      const updateDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.PAID,
      };

      mockChargeRepository.findById.mockResolvedValue(null);

      await expect(updateChargeStatusUseCase.execute(chargeId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(chargeRepository.findById).toHaveBeenCalledWith(chargeId);
      expect(chargeRepository.save).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException ao tentar alterar cobrança já paga', async () => {
      const mockCharge = new ChargeEntity(
        'customer-id',
        100.50,
        'BRL',
        PaymentMethodEnum.PIX,
        'Test charge',
        {},
      );
      mockCharge.id = chargeId;
      mockCharge.status = ChargeStatusEnum.PAID;

      const updateDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.FAILED,
      };

      mockChargeRepository.findById.mockResolvedValue(mockCharge);

      await expect(updateChargeStatusUseCase.execute(chargeId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(chargeRepository.findById).toHaveBeenCalledWith(chargeId);
      expect(chargeRepository.save).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException ao tentar alterar cobrança cancelada', async () => {
      const mockCharge = new ChargeEntity(
        'customer-id',
        100.50,
        'BRL',
        PaymentMethodEnum.PIX,
        'Test charge',
        {},
      );
      mockCharge.id = chargeId;
      mockCharge.status = ChargeStatusEnum.CANCELLED;

      const updateDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.PAID,
      };

      mockChargeRepository.findById.mockResolvedValue(mockCharge);

      await expect(updateChargeStatusUseCase.execute(chargeId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(chargeRepository.findById).toHaveBeenCalledWith(chargeId);
      expect(chargeRepository.save).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException ao tentar voltar para PENDING', async () => {
      const mockCharge = new ChargeEntity(
        'customer-id',
        100.50,
        'BRL',
        PaymentMethodEnum.PIX,
        'Test charge',
        {},
      );
      mockCharge.id = chargeId;
      mockCharge.status = ChargeStatusEnum.FAILED;

      const updateDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.PENDING,
      };

      mockChargeRepository.findById.mockResolvedValue(mockCharge);

      await expect(updateChargeStatusUseCase.execute(chargeId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(chargeRepository.findById).toHaveBeenCalledWith(chargeId);
      expect(chargeRepository.save).not.toHaveBeenCalled();
    });
  });
});
