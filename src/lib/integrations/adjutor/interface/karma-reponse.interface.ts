export interface KarmaResponseInterface {
  status: 'success' | 'error';
  message: string;
  data: {
    karma_identity: string;
    amount_in_contention: string;
    reason: null | string;
    default_date: string;
    karma_type: {
      karma: string;
    };
    karma_identity_type: {
      identity_type: string;
    };
    reporting_entity: {
      name: string;
      email: string;
    };
  };
  meta: {
    cost: number;
    balance: number;
  };
}
