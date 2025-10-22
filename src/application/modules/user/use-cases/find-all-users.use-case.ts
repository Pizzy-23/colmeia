import { UserEntity } from "@domain/entities/user.entity";
import { UserRepository } from "@domain/repositories/user.repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(options?: {
    filter?: any;
    relations?: string[];
    orderBy?: { [key: string]: 'ASC' | 'DESC' };
    skip?: number;
    take?: number;
  }): Promise<UserEntity[]> {
    const users = await this.userRepository.findAllWithRoles();
    return users;
  }
}
