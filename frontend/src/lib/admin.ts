import axios, { AxiosInstance } from 'axios';
import { ApiEnvelope } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

const ADMIN_TOKEN_KEY = 'afritransfer.adminToken';
const ADMIN_INFO_KEY = 'afritransfer.adminInfo';

export interface AdminInfo {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'COMPLIANCE';
}

export const adminStore = {
  get token() {
    return typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
  },
  get info(): AdminInfo | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(ADMIN_INFO_KEY);
    return raw ? (JSON.parse(raw) as AdminInfo) : null;
  },
  set(token: string, info: AdminInfo) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(info));
  },
  clear() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_INFO_KEY);
  },
};

/** Client API dédié à l'administration (jeton admin séparé). */
export const adminApi: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/v1`,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = adminStore.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      adminStore.clear();
      if (!window.location.pathname.endsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  },
);

interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  admin: AdminInfo;
}

export async function adminLogin(email: string, password: string): Promise<AdminInfo> {
  const res = await adminApi.post<ApiEnvelope<LoginResponse>>('/admin/auth/login', { email, password });
  const { accessToken, admin } = res.data.data;
  adminStore.set(accessToken, admin);
  return admin;
}

export function adminLogout() {
  adminStore.clear();
  if (typeof window !== 'undefined') window.location.href = '/admin/login';
}

/** Déballe l'enveloppe `{ success, data }`. */
export async function unwrapAdmin<T>(p: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  return (await p).data.data;
}
