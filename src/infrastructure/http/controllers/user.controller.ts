import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { CreateUserDto } from '../../../application/modules/user/dtos/create-user.dto';
import { CreateUserUseCase } from '../../../application/modules/user/use-cases/create-user.use-case';
import { FindAllUsersUseCase } from '../../../application/modules/user/use-cases/find-all-users.use-case';
import { GetUserByIdUseCase } from '../../../application/modules/user/use-cases/get-user-by-id.use-case';
import { AuthGuard } from '../../../application/modules/auth/guards/auth.guard';
import { RolesGuard } from '../../../application/modules/auth/guards/roles.guard';
import { Roles } from '../../../application/modules/auth/decorators/roles.decorator';
import { RoleEnum } from '../../../domain/constants/roles.enum';
import { Response } from 'express';
import { ResponseUtil } from '../../common/utils/response.util';
import { UserEntity } from '../../../domain/entities/user.entity';
import { UserDto } from '../../../application/modules/user/dtos/user.dto';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  private mapUserEntityToDto(user: UserEntity): UserDto {
    const userDto = new UserDto();
    userDto.id = user.id;
    userDto.name = user.name;
    userDto.email = user.email;
    
    try {
      userDto.roles = user.roles ? user.roles.map((role) => role.name) : [];
    } catch (error) {
      userDto.roles = [];
    }
    
    return userDto;
  }

  @Post()
  @Roles(RoleEnum.ADMIN)
  async create(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const user = await this.createUserUseCase.execute(createUserDto);
    res
      .status(HttpStatus.CREATED)
      .json(
        ResponseUtil.success(
          this.mapUserEntityToDto(user),
          'User created successfully.',
        ),
      );
  }

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  async findAll(@Res() res: Response) {
    const users = await this.findAllUsersUseCase.execute();
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.success(
          users.map(this.mapUserEntityToDto),
          'List of users retrieved successfully.',
        ),
      );
  }

  @Get(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const user = await this.getUserByIdUseCase.execute(id);
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.success(
          this.mapUserEntityToDto(user),
          'User retrieved successfully.',
        ),
      );
  }

  @Get('public/products')
  @Roles(RoleEnum.VISITOR, RoleEnum.USER, RoleEnum.ADMIN)
  getPublicProducts(@Res() res: Response) {
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.success(
          { message: 'Public product listing available to visitors.' },
          'Public access to products.',
        ),
      );
  }

  @Post('admin/products')
  @Roles(RoleEnum.ADMIN)
  createProduct(@Res() res: Response) {
    res
      .status(HttpStatus.CREATED)
      .json(
        ResponseUtil.success(
          { message: 'Product created by Admin.' },
          'Product created.',
        ),
      );
  }
}
