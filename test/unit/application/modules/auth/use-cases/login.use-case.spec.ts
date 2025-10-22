import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUseCase } from '@app/modules/auth/use-cases/login.use-case';
import { UserRepository } from '@domain/repositories/user.repository';
import { EncryptionUtil } from '@infra/common/utils/encryption.util';
import { LoginDto } from '@app/modules/auth/dtos/login.dto';
import { UserEntity } from '@domain/entities/user.entity';
import { RoleEntity } from '@domain/entities/role.entity';
import { RoleEnum } from '@domain/constants/roles.enum';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let userRepository: UserRepository;
  let jwtService: JwtService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mockAccessToken'),
  };

  const mockEncryptionUtil = {
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    loginUseCase = module.get<LoginUseCase>(LoginUseCase);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);

    (EncryptionUtil as any) = mockEncryptionUtil;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar um token de acesso para credenciais válidas', async () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'validpassword',
    };

    const user = new UserEntity();
    user.id = 'user-id';
    user.email = 'test@example.com';
    user.passwordHash = 'hashedpassword';

    const adminRole = new RoleEntity();
    adminRole.name = RoleEnum.ADMIN;
    user.roles = [adminRole]; 

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockEncryptionUtil.compare.mockResolvedValue(true);

    const result = await loginUseCase.execute(loginDto);

    expect(result).toEqual({ accessToken: 'mockAccessToken' });
    expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
    expect(mockEncryptionUtil.compare).toHaveBeenCalledWith(
      loginDto.password,
      user.passwordHash,
    );
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      roles: ['Admin'],
    });
  });

  it('deve lançar UnauthorizedException para email não encontrado', async () => {
    const loginDto: LoginDto = {
      email: 'notfound@example.com',
      password: 'password',
    };
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(loginUseCase.execute(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
    expect(mockEncryptionUtil.compare).not.toHaveBeenCalled();
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('deve lançar UnauthorizedException para senha incorreta', async () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };
    const user = new UserEntity();
    user.email = 'test@example.com';
    user.passwordHash = 'hashedpassword';

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockEncryptionUtil.compare.mockResolvedValue(false);

    await expect(loginUseCase.execute(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
    expect(mockEncryptionUtil.compare).toHaveBeenCalledWith(
      loginDto.password,
      user.passwordHash,
    );
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
