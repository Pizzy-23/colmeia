import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Res,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateCustomerDto } from '../../../application/modules/customer/dtos/create-customer.dto';
import { UpdateCustomerDto } from '../../../application/modules/customer/dtos/update-customer.dto';
import { CreateCustomerUseCase } from '../../../application/modules/customer/use-cases/create-customer.use-case';
import { FindAllCustomersUseCase } from '../../../application/modules/customer/use-cases/find-all-customers.use-case';
import { FindCustomerByIdUseCase } from '../../../application/modules/customer/use-cases/find-customer-by-id.use-case';
import { UpdateCustomerUseCase } from '../../../application/modules/customer/use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../../application/modules/customer/use-cases/delete-customer.use-case';
import { Response } from 'express';
import { ResponseUtil } from '../../common/utils/response.util';
import { CustomerEntity } from '../../../domain/entities/customer.entity';
import { CustomerDto } from '../../../application/modules/customer/dtos/customer.dto';
import { AuthGuard } from '../../../application/modules/auth/guards/auth.guard';
import { RolesGuard } from '../../../application/modules/auth/guards/roles.guard';
import { Roles } from '../../../application/modules/auth/decorators/roles.decorator';
import { RoleEnum } from '../../../domain/constants/roles.enum';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import { Idempotency } from '../../common/decorators/idempotency.decorator';

@Controller('customers')
@UseGuards(AuthGuard, RolesGuard)
export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly findAllCustomersUseCase: FindAllCustomersUseCase,
    private readonly findCustomerByIdUseCase: FindCustomerByIdUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
  ) {}

  private mapCustomerEntityToDto(customer: CustomerEntity): CustomerDto {
    const customerDto = new CustomerDto();
    customerDto.id = customer.id;
    customerDto.name = customer.name;
    customerDto.email = customer.email;
    customerDto.document = customer.document;
    customerDto.phone = customer.phone;
    customerDto.createdAt = customer.createdAt;
    customerDto.updatedAt = customer.updatedAt;
    return customerDto;
  }

  @Post()
  @Roles(RoleEnum.ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  @Idempotency('create-customer')
  async create(@Body() createCustomerDto: CreateCustomerDto, @Res() res: Response) {
    const customer = await this.createCustomerUseCase.execute(createCustomerDto);
    res
      .status(HttpStatus.CREATED)
      .json(
        ResponseUtil.success(
          this.mapCustomerEntityToDto(customer),
          'Customer created successfully.',
        ),
      );
  }

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  async findAll(@Res() res: Response) {
    const customers = await this.findAllCustomersUseCase.execute();
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.success(
          customers.map(customer => this.mapCustomerEntityToDto(customer)),
          'Customers retrieved successfully.',
        ),
      );
  }

  @Get(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  async findById(@Param('id') id: string, @Res() res: Response) {
    const customer = await this.findCustomerByIdUseCase.execute(id);
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.success(
          this.mapCustomerEntityToDto(customer),
          'Customer retrieved successfully.',
        ),
      );
  }

  @Put(':id')
  @Roles(RoleEnum.ADMIN)
  async update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto, @Res() res: Response) {
    const customer = await this.updateCustomerUseCase.execute(id, updateCustomerDto);
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.success(
          this.mapCustomerEntityToDto(customer),
          'Customer updated successfully.',
        ),
      );
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  async delete(@Param('id') id: string, @Res() res: Response) {
    await this.deleteCustomerUseCase.execute(id);
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.success(
          null,
          'Customer deleted successfully.',
        ),
      );
  }
}

