export type TransactionTypes = 'fund' | 'transfer' | 'withdraw';
export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface CreateTransactionInterface {
  id: string;
  amount: number;
  wallet_id: string;
  type: TransactionTypes;
  from_wallet_id?: string;
  to_wallet_id?: string;
  status: TransactionStatus;
  reference: string;
  description: string;
  balance_before: number;
  balance_after: number;
}
