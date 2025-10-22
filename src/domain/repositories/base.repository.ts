import { BaseEntity } from "../entities/base-entity"


export abstract class BaseRepository<TEntity extends BaseEntity> {
  abstract findById(id: string, relations?: string[]): Promise<TEntity | null>;
  abstract save(entity: TEntity): Promise<TEntity>;
  abstract delete(id: string): Promise<void>; 
  
  abstract findAll(options?: {
    filter?: any; 
    relations?: string[];
    orderBy?: { [key: string]: 'ASC' | 'DESC' };
    skip?: number;
    take?: number;
  }): Promise<TEntity[]>;
  
  abstract edit(id: string, updateData: Partial<TEntity>): Promise<TEntity | null>;
}