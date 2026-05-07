import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../repository/users.repository';
import { UsersService } from '../users.service';
import { WalletRepository } from '../../wallet/repositories/wallets.repository';
import { AdjutorService } from '../../../lib/integrations/adjutor/services/adjutor.service';
import { Knex } from 'knex';
import { getConnectionToken } from 'nest-knexjs';
import { ConfigService } from '@nestjs/config';

describe('UsersService', () => {
  let service: UsersService;
  const user = {
    firstName: 'Majeed',
    lastName: 'Shuaib',
    email: 'test@example.com',
    password: 'password',
    phone: '08012345678',
  };

  const wallet = {
    id: 'wallet_id',
    user_id: 'user_id',
    balance: 0,
  };

  // Mock repositories
  const mockUsersRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockWalletsRepository = {
    create: jest.fn(),
  };

  const mockAdjutorService = {
    checkKarma: jest.fn(),
  };

  const mockKnex = {
    transaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTransaction = () => {
    mockKnex.transaction.mockImplementation(
      async (callback: (trx: Knex.Transaction) => Promise<unknown>) =>
        callback({} as Knex.Transaction),
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,

        {
          provide: AdjutorService,
          useValue: mockAdjutorService,
        },

        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },

        {
          provide: WalletRepository,
          useValue: mockWalletsRepository,
        },

        {
          provide: getConnectionToken(),
          useValue: mockKnex,
        },

        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // Test the service is defined
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fail if user already exists', async () => {
    // Mock the findByEmail method
    mockUsersRepository.findByEmail.mockResolvedValue({
      id: 'uuid-1234',
    });

    await expect(service.register(user)).rejects.toThrow('User already exists');
  });

  it('should fail if user is blacklisted', async () => {
    mockUsersRepository.findByEmail.mockResolvedValue(null);
    mockAdjutorService.checkKarma.mockResolvedValue(true);

    await expect(service.register(user)).rejects.toThrow('User is blacklisted');
  });

  it('should create user successfully', async () => {
    mockUsersRepository.findByEmail.mockResolvedValue(null);

    mockAdjutorService.checkKarma.mockResolvedValue(false);

    mockUsersRepository.create.mockResolvedValue({
      id: 'user-id',
      ...user,
    });

    mockWalletsRepository.create.mockResolvedValue(wallet);

    mockTransaction();

    const result = await service.register(user);

    expect(result).toBeDefined();

    expect(mockUsersRepository.create).toHaveBeenCalled();
  });

  it('should create wallet on signup', async () => {
    mockUsersRepository.findByEmail.mockResolvedValue(null);

    mockAdjutorService.checkKarma.mockResolvedValue(false);

    mockUsersRepository.create.mockResolvedValue({
      id: 'user-id',
      ...user,
    });

    mockWalletsRepository.create.mockResolvedValue(wallet);

    mockTransaction();

    await service.register(user);

    expect(mockWalletsRepository.create).toHaveBeenCalled();

    expect(mockWalletsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        balance: 0,
      }),
      expect.anything(),
    );
  });
});
