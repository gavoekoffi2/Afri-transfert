'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './api';
import {
  Beneficiary,
  Country,
  DetectionResult,
  Operator,
  Paginated,
  Quote,
  SendMoneyInput,
  Transaction,
} from './types';

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: () => unwrap<Country[]>(api.get('/countries')),
    staleTime: 1000 * 60 * 30,
  });
}

export function useOperators(iso2?: string) {
  return useQuery({
    queryKey: ['operators', iso2],
    queryFn: () => unwrap<Operator[]>(api.get(`/countries/${iso2}/operators`)),
    enabled: !!iso2,
  });
}

export function useDetectPhone(phone: string) {
  return useQuery({
    queryKey: ['detect', phone],
    queryFn: () => unwrap<DetectionResult>(api.get('/countries/detect', { params: { phone } })),
    enabled: /^\+[1-9]\d{6,14}$/.test(phone),
  });
}

export function useQuote() {
  return useMutation({
    mutationFn: (input: { senderCountryIso2: string; recipientCountryIso2: string; amount: number }) =>
      unwrap<Quote>(api.post('/transactions/quote', input)),
  });
}

export function useSendMoney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMoneyInput) => unwrap<Transaction>(api.post('/transactions', input)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useTransactions(page = 1) {
  return useQuery({
    queryKey: ['transactions', page],
    queryFn: () => unwrap<Paginated<Transaction>>(api.get('/transactions', { params: { page, limit: 10 } })),
  });
}

export function useTransaction(reference: string) {
  return useQuery({
    queryKey: ['transaction', reference],
    queryFn: () => unwrap<Transaction>(api.get(`/transactions/${reference}`)),
    enabled: !!reference,
  });
}

export function useBeneficiaries() {
  return useQuery({
    queryKey: ['beneficiaries'],
    queryFn: () => unwrap<Beneficiary[]>(api.get('/beneficiaries')),
  });
}

export function useCreateBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; phone: string; countryIso2: string; operatorId?: string }) =>
      unwrap<Beneficiary>(api.post('/beneficiaries', input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beneficiaries'] }),
  });
}

export function useDeleteBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/beneficiaries/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beneficiaries'] }),
  });
}
