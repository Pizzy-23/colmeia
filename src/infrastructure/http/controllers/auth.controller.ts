import { Body, Controller, Post, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginDto } from '../../../application/modules/auth/dtos/login.dto';
import { LoginUseCase } from '../../../application/modules/auth/use-cases/login.use-case';
import { Response } from 'express';
import { ResponseUtil } from '../../common/utils/response.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'Autenticar usuário',
    description: 'Realiza login do usuário e retorna token JWT'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Login successful.',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '123',
            name: 'Admin User',
            email: 'admin@example.com',
            roles: ['ADMIN']
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciais inválidas',
    schema: {
      example: {
        success: false,
        message: 'Invalid credentials',
        statusCode: 401
      }
    }
  })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const result = await this.loginUseCase.execute(dto);
    res.status(HttpStatus.OK).json(ResponseUtil.success(result, 'Login realizado com sucesso.'));
  }
}
