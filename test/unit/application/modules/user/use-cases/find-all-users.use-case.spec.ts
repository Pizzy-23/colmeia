
import { Test } from '@nestjs/testing';
import { FindAllUsersUseCase } from '@app/modules/user/use-cases/find-all-users.use-case';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserEntity } from '@domain/entities/user.entity';
import { RoleEntity } from '@domain/entities/role.entity';
import { RoleEnum } from '@domain/constants/roles.enum';

describe('FindAllUsersUseCase', () => {
  let findAllUsersUseCase: FindAllUsersUseCase;
  let userRepository: UserRepository;

  const mockUserRepository = {
    findAllWithRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllUsersUseCase,
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    findAllUsersUseCase = module.get<FindAllUsersUseCase>(FindAllUsersUseCase);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar todos os usuários com suas roles', async () => {
    const adminRole = new RoleEntity();
    adminRole.name = RoleEnum.ADMIN;
    const userRole = new RoleEntity();
    userRole.name = RoleEnum.USER;

    const user1 = new UserEntity();
    user1.id = 'user1';
    user1.name = 'User One';
    user1.email = 'one@example.com';
    user1.roles = [adminRole];

    const user2 = new UserEntity();
    user2.id = 'user2';
    user2.name = 'User Two';
    user2.email = 'two@example.com';
    user2.roles = [userRole];

    mockUserRepository.findAllWithRoles.mockResolvedValue([user1, user2]);

    const result = await findAllUsersUseCase.execute();

    expect(result).toEqual([user1, user2]);
    expect(userRepository.findAllWithRoles).toHaveBeenCalled();
    expect(result.length).toBe(2);
    expect(result[0].roles[0].name).toEqual(RoleEnum.ADMIN);
  });

  it('deve retornar um array vazio se não houver usuários', async () => {
    mockUserRepository.findAllWithRoles.mockResolvedValue([]);

    const result = await findAllUsersUseCase.execute();

    expect(result).toEqual([]);
    expect(userRepository.findAllWithRoles).toHaveBeenCalled();
    expect(result.length).toBe(0);
  });
});