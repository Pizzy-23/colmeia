import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { RoleSchema } from './role.schema';
import { BaseTypeOrmSchema } from './base-typeorm.schema'; 

@Entity('users')
export class UserSchema extends BaseTypeOrmSchema { 
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @ManyToMany(() => RoleSchema, { cascade: true, eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleSchema[];
}