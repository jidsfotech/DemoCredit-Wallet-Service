import { Injectable } from '@nestjs/common';
import { InjectConnection } from 'nest-knexjs';
import { Knex } from 'knex';
import { CreateUser } from '../interface/create-user.interface';
import { User } from '../interface/user.interface';

@Injectable()
export class UsersRepository {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async checkDb(): Promise<boolean> {
    const result = await this.knex.raw('SELECT 1');
    return !!result;
  }

  async create(payload: CreateUser, trx?: Knex.Transaction): Promise<User> {
    const db = trx || this.knex;

    await db('users').insert(payload);
    const user = await db<User>('users').where({ id: payload.id }).first();

    if (!user) throw new Error('User creation failed');
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.knex<User>('users').where({ email }).first();
    return user!;
  }

  async findByPhone(phone: string): Promise<User> {
    const user = await this.knex<User>('users').where({ phone }).first();
    return user!;
  }

  async find(params: {
    id: string;
    email: string;
    phone: string;
  }): Promise<User> {
    const user = await this.knex<User>('users').where(params).first();
    if (!user) throw new Error('User not found');
    return user;
  }
}
