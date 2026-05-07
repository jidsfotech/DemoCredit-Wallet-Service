export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  is_blacklisted: boolean;
  created_at: Date;
  updated_at: Date;
}
