import {
  TransactionStatus,
  TransactionTypes,
} from './create-transaction.interface';

export interface Transaction {
  id: string;
  amount: number;
  wallet_id: string;
  type: TransactionTypes;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  status: TransactionStatus;
  reference: string;
  description: string;
  balance_before: number;
  balance_after: number;
  created_at: Date;
  updated_at: Date;
}
