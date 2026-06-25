import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { geniuspayConfig } from '../../config/configuration';
import {
  CreatePaymentRequest,
  GeniusPayPayment,
  GeniusPaySuccess,
  ListPaymentsQuery,
  MerchantAccount,
  MerchantBalance,
  PawaPayAllProviders,
  PawaPayCountryProviders,
} from './geniuspay.types';

/**
 * Client HTTP typé de l'API Marchand GeniusPay.
 *
 * Authentification par en-têtes `X-API-Key` / `X-API-Secret` (jamais exposés côté client).
 * Toutes les réponses sont déballées de leur enveloppe `{ success, data }`.
 */
@Injectable()
export class GeniusPayService {
  private readonly logger = new Logger(GeniusPayService.name);

  constructor(
    private readonly http: HttpService,
    @Inject(geniuspayConfig.KEY)
    private readonly config: ConfigType<typeof geniuspayConfig>,
  ) {}

  get environment(): string {
    return this.config.environment;
  }

  private requestConfig(extra: AxiosRequestConfig = {}): AxiosRequestConfig {
    return {
      baseURL: this.config.baseUrl,
      timeout: 20000,
      ...extra,
      headers: {
        'X-API-Key': this.config.apiKey,
        'X-API-Secret': this.config.apiSecret,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(extra.headers ?? {}),
      },
    };
  }

  // ----------------------------------------------------------------- PAIEMENTS
  /**
   * Initie un paiement. Sans `payment_method`, GeniusPay renvoie un `checkout_url`
   * (page hébergée) ; avec, un `payment_url` vers le gateway.
   */
  async createPayment(payload: CreatePaymentRequest): Promise<GeniusPayPayment> {
    return this.post<GeniusPayPayment>('/payments', payload);
  }

  /** Récupère une transaction par sa référence GeniusPay (MTX-XXXXXXXX). */
  async getPayment(reference: string): Promise<GeniusPayPayment> {
    return this.get<GeniusPayPayment>(`/payments/${encodeURIComponent(reference)}`);
  }

  /** Liste paginée des paiements côté GeniusPay (utilisé par le dashboard admin). */
  async listPayments(query: ListPaymentsQuery = {}): Promise<GeniusPaySuccess<GeniusPayPayment[]>> {
    const { data } = await this.execute<GeniusPaySuccess<GeniusPayPayment[]>>(
      this.requestConfig({ method: 'GET', url: '/payments', params: query }),
    );
    return data;
  }

  // ----------------------------------------------------------------- PAWAPAY
  /** Découverte des opérateurs MMO pour un pays donné. */
  async getProvidersForCountry(countryIso2: string): Promise<PawaPayCountryProviders> {
    return this.get<PawaPayCountryProviders>('/pawapay/providers', { country: countryIso2 });
  }

  /** Découverte de tous les pays/opérateurs disponibles. */
  async getAllProviders(): Promise<PawaPayAllProviders> {
    return this.get<PawaPayAllProviders>('/pawapay/providers');
  }

  // ----------------------------------------------------------------- COMPTE
  async getAccount(): Promise<MerchantAccount> {
    return this.get<MerchantAccount>('/account');
  }

  async getBalance(): Promise<MerchantBalance> {
    return this.get<MerchantBalance>('/account/balance');
  }

  // ----------------------------------------------------------------- INTERNE
  private async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const { data } = await this.execute<GeniusPaySuccess<T>>(
      this.requestConfig({ method: 'GET', url, params }),
    );
    return data.data;
  }

  private async post<T>(url: string, body: unknown): Promise<T> {
    const { data } = await this.execute<GeniusPaySuccess<T>>(
      this.requestConfig({ method: 'POST', url, data: body }),
    );
    return data.data;
  }

  private async execute<T>(cfg: AxiosRequestConfig): Promise<{ data: T }> {
    try {
      const response = await firstValueFrom(this.http.request<T>(cfg));
      return { data: response.data };
    } catch (error) {
      throw this.normalizeError(error as AxiosError);
    }
  }

  /**
   * Convertit une erreur Axios en exception NestJS, en préservant le code/message
   * d'erreur GeniusPay lorsqu'ils sont disponibles.
   */
  private normalizeError(error: AxiosError): HttpException | ServiceUnavailableException {
    if (error.response) {
      const status = error.response.status;
      const body = error.response.data as { error?: { code?: string; message?: string } };
      const code = body?.error?.code ?? 'GENIUSPAY_ERROR';
      const message = body?.error?.message ?? 'Erreur GeniusPay';
      this.logger.warn(`GeniusPay ${status} ${code}: ${message}`);
      // Un 401/403 de GeniusPay = problème d'identifiants/marchand côté serveur :
      // c'est une erreur de passerelle (502), pas un échec d'authentification du client.
      // (sinon le dashboard admin déconnecterait l'utilisateur sur un simple appel solde)
      if (status === 401 || status === 403) {
        return new BadGatewayException({ message: `GeniusPay: ${message}`, error: code });
      }
      return new HttpException({ message, error: code, geniuspay: true }, status);
    }
    // Erreur réseau / timeout : le service de paiement est injoignable.
    this.logger.error(`GeniusPay injoignable: ${error.message}`);
    return new ServiceUnavailableException('Service de paiement temporairement indisponible');
  }
}
