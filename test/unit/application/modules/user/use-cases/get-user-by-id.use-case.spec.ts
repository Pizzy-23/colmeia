import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetUserByIdUseCase } from '@app/modules/user/use-cases/get-user-by-id.use-case';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserEntity } from '@domain/entities/user.entity';

describe('GetUserByIdUseCase', () => {
  let getUserByIdUseCase: GetUserByIdUseCase;
  let userRepository: UserRepository;

  const mockUserRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetUserByIdUseCase,
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    getUserByIdUseCase = module.get<GetUserByIdUseCase>(GetUserByIdUseCase);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar um usuário se encontrado', async () => {
    const userId = 'some-user-id';
    const user = new UserEntity();
    user.id = userId;
    user.name = 'Test User';
    mockUserRepository.findById.mockResolvedValue(user);

    const result = await getUserByIdUseCase.execute(userId);

    expect(result).toEqual(user);
    expect(userRepository.findById).toHaveBeenCalledWith(userId);
  });

  it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
    const userId = 'non-existent-id';
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(getUserByIdUseCase.execute(userId)).rejects.toThrow(
      NotFoundException,
    );
    expect(userRepository.findById).toHaveBeenCalledWith(userId);
  });
});
