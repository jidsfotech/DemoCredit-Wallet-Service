import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from 'nest-knexjs';
import { Knex } from 'knex';

import { WalletService } from '../wallet.service';
import { WalletRepository } from '../repositories/wallets.repository';
import { TransactionsRepository } from '../../transactions/repositories/transactions.repository';

describe('WalletService', () => {
  let service: WalletService;

  const mockWalletRepository = {
    findByUserId: jest.fn(),
    findByIdForUpdate: jest.fn(),
    updateBalance: jest.fn(),
    getTodayWithdrawalTotal: jest.fn(),
  };

  const mockTransactionsRepository = {
    create: jest.fn(),
    findByReference: jest.fn(),
  };

  const mockKnex = {
    transaction: jest.fn(),
  };

  const mockTransaction = () => {
    mockKnex.transaction.mockImplementation(
      async (callback: (trx: Knex.Transaction) => Promise<unknown>) =>
        callback({} as Knex.Transaction),
    );
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: WalletRepository,
          useValue: mockWalletRepository,
        },
        {
          provide: TransactionsRepository,
          useValue: mockTransactionsRepository,
        },
        {
          provide: getConnectionToken(),
          useValue: mockKnex,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  describe('fundWallet', () => {
    it('should fund wallet successfully', async () => {
      mockTransaction();

      mockTransactionsRepository.findByReference.mockResolvedValue(null);

      mockWalletRepository.findByUserId.mockResolvedValue({
        id: 'wallet-1',
      });

      mockWalletRepository.findByIdForUpdate.mockResolvedValue({
        id: 'wallet-1',
        balance: 100,
        status: 'active',
      });

      mockWalletRepository.updateBalance.mockResolvedValue(true);

      mockTransactionsRepository.create.mockResolvedValue(true);

      const result = await service.fundWallet({
        userId: 'user-1',
        amount: 200,
        reference: 'ref-1',
      });

      expect(result).toEqual({
        message: 'Wallet funded successfully',
        balance: 300,
      });

      expect(mockWalletRepository.updateBalance).toHaveBeenCalled();

      expect(mockTransactionsRepository.create).toHaveBeenCalled();
    });

    it('should throw if amount is less than or equal to zero', async () => {
      await expect(
        service.fundWallet({
          userId: 'user-1',
          amount: 0,
          reference: 'ref-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if transaction reference already exists', async () => {
      mockTransactionsRepository.findByReference.mockResolvedValue({
        id: 'trx-1',
      });

      await expect(
        service.fundWallet({
          userId: 'user-1',
          amount: 100,
          reference: 'ref-1',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw if wallet does not exist', async () => {
      mockTransactionsRepository.findByReference.mockResolvedValue(null);

      mockWalletRepository.findByUserId.mockResolvedValue(null);

      await expect(
        service.fundWallet({
          userId: 'user-1',
          amount: 100,
          reference: 'ref-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if wallet is suspended', async () => {
      mockTransaction();

      mockTransactionsRepository.findByReference.mockResolvedValue(null);

      mockWalletRepository.findByUserId.mockResolvedValue({
        id: 'wallet-1',
      });

      mockWalletRepository.findByIdForUpdate.mockResolvedValue({
        id: 'wallet-1',
        balance: 100,
        status: 'suspended',
      });

      await expect(
        service.fundWallet({
          userId: 'user-1',
          amount: 100,
          reference: 'ref-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
