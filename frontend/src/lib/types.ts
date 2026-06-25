export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  countryIso2?: string | null;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

export interface Country {
  id: string;
  iso2: string;
  iso3?: string;
  name: string;
  callingCode?: string;
  currencyCode: string;
  region?: string;
  flagEmoji?: string;
  supportsPawapay: boolean;
}

export interface Operator {
  id: string;
  code: string;
  name: string;
  paymentMethod: string;
  gateway?: string;
  countryId: string;
}

export interface DetectionResult {
  country: Country | null;
  operators: Operator[];
}

export interface Quote {
  sendAmount: number;
  sendCurrency: string;
  commission: number;
  geniusPayFees: number;
  totalAmount: number;
  receiveAmount: number;
  receiveCurrency: string;
  fxRate: number;
}

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export interface Transaction {
  id: string;
  reference: string;
  recipientName: string;
  recipientPhone: string;
  sendAmount: number;
  sendCurrency: string;
  commissionAmount: number;
  geniusPayFees: number;
  totalAmount: number;
  receiveAmount: number;
  receiveCurrency: string;
  status: TransactionStatus;
  paymentUrl?: string | null;
  checkoutUrl?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface Beneficiary {
  id: string;
  name: string;
  phone: string;
  isFavorite: boolean;
  country?: Country;
  operator?: Operator | null;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface SendMoneyInput {
  senderCountryIso2: string;
  recipientCountryIso2: string;
  recipientName: string;
  recipientPhone: string;
  amount: number;
  operatorId?: string;
  saveBeneficiary?: boolean;
}
