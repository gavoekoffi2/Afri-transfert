'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from './admin';
import { Paginated, TransactionStatus } from './types';

/* ----------------------------------------------------------------- Types */
export interface AdminStats {
  users: number;
  transactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  totalVolume: number;
  totalCommission: number;
  byStatus: { status: string; count: number }[];
  recentTransactions: {
    reference: string;
    amount: number;
    currency: string;
    status: TransactionStatus;
    user: string;
    recipient: string;
    country: string;
    createdAt: string;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  status: string;
  role: string;
  countryIso2?: string | null;
  emailVerifiedAt?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  _count?: { transactions: number };
}

export interface AdminTransaction {
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
  gateway?: string | null;
  createdAt: string;
  user?: { email: string };
  senderCountry?: { name: string; iso2: string };
  recipientCountry?: { name: string; iso2: string };
}

export interface AdminCountry {
  id: string;
  iso2: string;
  name: string;
  currencyCode: string;
  region?: string;
  flagEmoji?: string;
  isActive: boolean;
  supportsPawapay: boolean;
  _count?: { operators: number };
}

export interface AdminSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  group: string;
  description?: string;
  isSecret: boolean;
}

export interface AdminWebhook {
  id: string;
  eventId: string;
  deliveryId?: string | null;
  event: string;
  signatureValid: boolean;
  timestamp: string;
  environment?: string | null;
  processed: boolean;
  error?: string | null;
  receivedAt: string;
}

export interface MerchantBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}

/* ----------------------------------------------------------------- Hooks */
export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: () => unwrapAdmin<AdminStats>(adminApi.get('/admin/stats')) });
}

export function useAdminUsers(params: { page: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () =>
      unwrapAdmin<Paginated<AdminUser>>(adminApi.get('/admin/users', { params: { ...params, limit: 12 } })),
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminTransactions(params: { page: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'transactions', params],
    queryFn: () =>
      unwrapAdmin<Paginated<AdminTransaction>>(adminApi.get('/admin/transactions', { params: { ...params, limit: 12 } })),
  });
}

export function useAdminCountries() {
  return useQuery({
    queryKey: ['admin', 'countries'],
    queryFn: () => unwrapAdmin<AdminCountry[]>(adminApi.get('/admin/countries')),
  });
}

export function useToggleCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ iso2, isActive }: { iso2: string; isActive: boolean }) =>
      adminApi.patch(`/admin/countries/${iso2}/active`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'countries'] }),
  });
}

export function useSyncOperators() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.post('/admin/operators/sync'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'countries'] }),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => unwrapAdmin<AdminSetting[]>(adminApi.get('/admin/settings')),
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminApi.put(`/admin/settings/${key}`, { value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
}

export function useAdminWebhooks(page: number) {
  return useQuery({
    queryKey: ['admin', 'webhooks', page],
    queryFn: () => unwrapAdmin<Paginated<AdminWebhook>>(adminApi.get('/admin/webhooks', { params: { page, limit: 15 } })),
  });
}

export function useAdminBalance() {
  return useQuery({
    queryKey: ['admin', 'balance'],
    queryFn: () => unwrapAdmin<MerchantBalance>(adminApi.get('/admin/geniuspay/balance')),
    retry: false,
  });
}
