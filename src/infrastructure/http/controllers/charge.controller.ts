import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../../../application/modules/auth/guards/auth.guard';
import { RolesGuard } from '../../../application/modules/auth/guards/roles.guard';
import { Roles } from '../../../application/modules/auth/decorators/roles.decorator';
import { RoleEnum } from '../../../domain/constants/roles.enum';
import { CreateChargeUseCase } from '@app/modules/charge/use-cases/create-charge.use-case';
import { FindAllChargesUseCase } from '@app/modules/charge/use-cases/find-all-charges.use-case';
import { FindChargeByIdUseCase } from '@app/modules/charge/use-cases/find-charge-by-id.use-case';
import { FindChargesByCustomerUseCase } from '@app/modules/charge/use-cases/find-charges-by-customer.use-case';
import { UpdateChargeStatusUseCase } from '@app/modules/charge/use-cases/update-charge-status.use-case';
import { CreateChargeDto } from '@app/modules/charge/dtos/create-charge.dto';
import { UpdateChargeStatusDto } from '@app/modules/charge/dtos/update-charge-status.dto';
import { ChargeDto } from '@app/modules/charge/dtos/charge.dto';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import { Idempotency } from '../../common/decorators/idempotency.decorator';

@Controller('charges')
@UseGuards(AuthGuard, RolesGuard)
export class ChargeController {
  constructor(
    private readonly createChargeUseCase: CreateChargeUseCase,
    private readonly findAllChargesUseCase: FindAllChargesUseCase,
    private readonly findChargeByIdUseCase: FindChargeByIdUseCase,
    private readonly findChargesByCustomerUseCase: FindChargesByCustomerUseCase,
    private readonly updateChargeStatusUseCase: UpdateChargeStatusUseCase,
  ) {}

  @Post()
  @Roles(RoleEnum.ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  @Idempotency('create-charge')
  async create(@Body() createChargeDto: CreateChargeDto, @Res() res: Response) {
    const charge = await this.createChargeUseCase.execute(createChargeDto);
    const chargeDto = this.mapChargeEntityToDto(charge);
    
    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Charge created successfully.',
      data: chargeDto,
    });
  }

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  async findAll(@Res() res: Response) {
    const charges = await this.findAllChargesUseCase.execute();
    const chargesDto = charges.map(this.mapChargeEntityToDto);
    
    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Charges retrieved successfully.',
      data: chargesDto,
    });
  }

  @Get(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  async findById(@Param('id') id: string, @Res() res: Response) {
    const charge = await this.findChargeByIdUseCase.execute(id);
    const chargeDto = this.mapChargeEntityToDto(charge);
    
    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Charge retrieved successfully.',
      data: chargeDto,
    });
  }

  @Get('customer/:customerId')
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  async findByCustomer(@Param('customerId') customerId: string, @Res() res: Response) {
    const charges = await this.findChargesByCustomerUseCase.execute(customerId);
    const chargesDto = charges.map(this.mapChargeEntityToDto);
    
    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Customer charges retrieved successfully.',
      data: chargesDto,
    });
  }

  @Put(':id/status')
  @Roles(RoleEnum.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateChargeStatusDto: UpdateChargeStatusDto,
    @Res() res: Response,
  ) {
    const charge = await this.updateChargeStatusUseCase.execute(id, updateChargeStatusDto);
    const chargeDto = this.mapChargeEntityToDto(charge);
    
    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Charge status updated successfully.',
      data: chargeDto,
    });
  }

  private mapChargeEntityToDto(charge: any): ChargeDto {
    const chargeDto = new ChargeDto();
    chargeDto.id = charge.id;
    chargeDto.customerId = charge.customerId;
    chargeDto.amount = charge.amount;
    chargeDto.currency = charge.currency;
    chargeDto.paymentMethod = charge.paymentMethod;
    chargeDto.status = charge.status;
    chargeDto.description = charge.description;
    chargeDto.metadata = charge.metadata;
    chargeDto.paidAt = charge.paidAt;
    chargeDto.expiresAt = charge.expiresAt;
    chargeDto.failureReason = charge.failureReason;
    chargeDto.createdAt = charge.createdAt;
    chargeDto.updatedAt = charge.updatedAt;
    return chargeDto;
  }
}
