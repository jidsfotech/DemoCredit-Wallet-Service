import type { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const KnexConfig: Record<string, Knex.Config> = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: './src/common/database/migrations',
    },
  },

  test: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: './src/common/database/migrations',
    },
  },

  production: {
    client: 'mysql2',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './dist/src/common/database/migrations',
    },
  },
};

export default KnexConfig;
