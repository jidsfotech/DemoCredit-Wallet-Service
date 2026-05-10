export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  status: 'active' | 'suspended';
  created_at: Date;
  updated_at: Date;
}
