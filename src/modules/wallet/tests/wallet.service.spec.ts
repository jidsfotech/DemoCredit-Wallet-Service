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

  describe('transfer', () => {
    it('should transfer funds successfully', async () => {
      mockTransaction();

      mockWalletRepository.findByUserId
        .mockResolvedValueOnce({
          id: 'wallet-1',
          balance: 500,
          status: 'active',
        })
        .mockResolvedValueOnce({
          id: 'wallet-2',
          balance: 100,
          status: 'active',
        });

      mockWalletRepository.findByIdForUpdate
        .mockResolvedValueOnce({
          id: 'wallet-1',
          balance: 500,
          status: 'active',
        })
        .mockResolvedValueOnce({
          id: 'wallet-2',
          balance: 100,
          status: 'active',
        });

      const result = await service.transfer({
        senderUserId: 'user-1',
        receiverUserId: 'user-2',
        amount: 200,
      });

      expect(result).toEqual({
        message: 'Transfer successful',
        balance: 300,
      });

      expect(mockWalletRepository.updateBalance).toHaveBeenCalledTimes(2);

      expect(mockTransactionsRepository.create).toHaveBeenCalled();
    });

    it('should fail on self transfer', async () => {
      await expect(
        service.transfer({
          senderUserId: 'user-1',
          receiverUserId: 'user-1',
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail if sender wallet does not exist', async () => {
      mockWalletRepository.findByUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'wallet-2',
        });

      await expect(
        service.transfer({
          senderUserId: 'user-1',
          receiverUserId: 'user-2',
          amount: 100,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fail if receiver wallet does not exist', async () => {
      mockWalletRepository.findByUserId
        .mockResolvedValueOnce({
          id: 'wallet-1',
          balance: 500,
        })
        .mockResolvedValueOnce(null);

      await expect(
        service.transfer({
          senderUserId: 'user-1',
          receiverUserId: 'user-2',
          amount: 100,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fail on insufficient balance', async () => {
      mockWalletRepository.findByUserId
        .mockResolvedValueOnce({
          id: 'wallet-1',
          balance: 50,
          status: 'active',
        })
        .mockResolvedValueOnce({
          id: 'wallet-2',
          balance: 100,
          status: 'active',
        });

      await expect(
        service.transfer({
          senderUserId: 'user-1',
          receiverUserId: 'user-2',
          amount: 200,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockTransactionsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });

    it('should fail if sender wallet is suspended', async () => {
      mockTransaction();

      mockWalletRepository.findByUserId
        .mockResolvedValueOnce({
          id: 'wallet-1',
          balance: 500,
          status: 'suspended',
        })
        .mockResolvedValueOnce({
          id: 'wallet-2',
          balance: 100,
          status: 'active',
        });

      mockWalletRepository.findByIdForUpdate
        .mockResolvedValueOnce({
          id: 'wallet-1',
          balance: 500,
          status: 'suspended',
        })
        .mockResolvedValueOnce({
          id: 'wallet-2',
          balance: 100,
          status: 'active',
        });

      await expect(
        service.transfer({
          senderUserId: 'user-1',
          receiverUserId: 'user-2',
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use locked wallet query during transfer', async () => {
      mockTransaction();

      mockWalletRepository.findByUserId
        .mockResolvedValueOnce({
          id: 'wallet-1',
          balance: 500,
          status: 'active',
        })
        .mockResolvedValueOnce({
          id: 'wallet-2',
          balance: 100,
          status: 'active',
        });

      mockWalletRepository.findByIdForUpdate
        .mockResolvedValueOnce({
          id: 'wallet-1',
          balance: 500,
          status: 'active',
        })
        .mockResolvedValueOnce({
          id: 'wallet-2',
          balance: 100,
          status: 'active',
        });

      await service.transfer({
        senderUserId: 'user-1',
        receiverUserId: 'user-2',
        amount: 100,
      });

      expect(mockWalletRepository.findByIdForUpdate).toHaveBeenCalled();
    });
  });
});
