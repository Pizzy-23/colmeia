// test/unit/application/modules/user/use-cases/create-user.use-case.spec.ts

import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateUserUseCase } from '@app/modules/user/use-cases/create-user.use-case';
import { UserRepository } from '@domain/repositories/user.repository';
import { RoleRepository } from '@domain/repositories/role.repository';
import { EncryptionUtil } from '@infra/common/utils/encryption.util';
import { RoleEnum } from '@domain/constants/roles.enum';
import { UserEntity } from '@domain/entities/user.entity';
import { RoleEntity } from '@domain/entities/role.entity';
import { CreateUserDto } from '@app/modules/user/dtos/create-user.dto';

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  let userRepository: UserRepository;
  let roleRepository: RoleRepository;

  // Mocks das dependências
  const mockUserRepository = {
    findByEmail: jest.fn(),
    save: jest.fn(),
  };

  const mockRoleRepository = {
    findByName: jest.fn(),
  };

  const mockEncryptionUtil = {
    hash: jest.fn(() => Promise.resolve('hashedPassword')),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: RoleRepository, useValue: mockRoleRepository },
      ],
    }).compile();

    createUserUseCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    userRepository = module.get<UserRepository>(UserRepository);
    roleRepository = module.get<RoleRepository>(RoleRepository);

    (EncryptionUtil as any) = mockEncryptionUtil;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar um novo usuário com sucesso', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    const adminRole = new RoleEntity();
    adminRole.id = 'role-id';
    adminRole.name = RoleEnum.USER;

    mockUserRepository.findByEmail.mockResolvedValue(null); 
    mockRoleRepository.findByName.mockResolvedValue(adminRole); 
    mockUserRepository.save.mockImplementation((user: UserEntity) => {
      user.id = 'new-user-id'; 
      user.createdAt = new Date();
      user.updatedAt = new Date();
      return Promise.resolve(user);
    });

    const result = await createUserUseCase.execute(createUserDto);

    expect(result).toBeInstanceOf(UserEntity);
    expect(result.email).toEqual(createUserDto.email);
    expect(result.passwordHash).toEqual('hashedPassword');
    expect(result.roles).toEqual([adminRole]);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
    expect(mockRoleRepository.findByName).toHaveBeenCalledWith(RoleEnum.USER);
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('deve lançar ConflictException se o email já existe', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'password123',
    };
    mockUserRepository.findByEmail.mockResolvedValue(new UserEntity()); 

    await expect(createUserUseCase.execute(createUserDto)).rejects.toThrow(ConflictException);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
    expect(mockRoleRepository.findByName).not.toHaveBeenCalled(); // Não deve tentar buscar a role
    expect(mockUserRepository.save).not.toHaveBeenCalled(); // Não deve tentar salvar
  });

  it('deve lançar um erro se a role não for encontrada', async () => {
    const createUserDto: CreateUserDto = {
      name: 'User Without Role',
      email: 'norole@example.com',
      password: 'password123',
    };
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockRoleRepository.findByName.mockResolvedValue(null); // Role não encontrada

    await expect(createUserUseCase.execute(createUserDto)).rejects.toThrow('Role "User" não encontrada.');
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
    expect(mockRoleRepository.findByName).toHaveBeenCalledWith(RoleEnum.USER);
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});