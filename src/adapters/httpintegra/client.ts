import type {
  APIResponse,
  CreateBusinessRequest,
  CreateCessionRequest,
  CreateDocumentRequest,
  CreatePurchaseRequest,
  GeneratePDFRequest,
  UpdateBusinessRequest,
  UploadCertificateRequest,
  UploadNumerationRequest
} from '../../domain/types.js';
import type { IntegraFacturacionAPI } from '../../ports/api.js';

export const DEFAULT_BASE_URL = 'https://api.integrafacturacion.cl';

export interface ClientConfig {
  apiKey: string;
  baseURL?: string;
  fetchFn?: typeof fetch;
  userAgent?: string;
}

export class APIError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: string
  ) {
    super(`integrafacturacion: status=${statusCode} body=${body}`);
    this.name = 'APIError';
  }
}

export class Client implements IntegraFacturacionAPI {
  private readonly fetchFn: typeof fetch;
  private readonly baseURL: string;
  private readonly userAgent: string;

  constructor(private readonly config: ClientConfig) {
    if (!config.apiKey?.trim()) {
      throw new Error('integrafacturacion: API key is required');
    }

    this.baseURL = (config.baseURL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');

    if (!isValidURL(this.baseURL)) {
      throw new Error('integrafacturacion: invalid base URL');
    }

    this.fetchFn = config.fetchFn ?? fetch;
    this.userAgent = config.userAgent?.trim() || '@integrafacturacion/sdk/0.1.0';
  }

  async createDocument(req: CreateDocumentRequest): Promise<APIResponse> {
    return this.doJSON('POST', '/api/v1/documents', undefined, stripIdempotency(req), withIdempotency(req.idempotencyKey));
  }

  async getDocument(id: string): Promise<APIResponse> {
    return this.doJSON('GET', `/api/v1/documents/${id}`);
  }

  async getDocumentStats(): Promise<APIResponse> {
    return this.doJSON('GET', '/api/v1/documents/stats');
  }

  async createCession(req: CreateCessionRequest): Promise<APIResponse> {
    return this.doJSON('POST', '/api/v1/cessions', undefined, stripIdempotency(req), withIdempotency(req.idempotencyKey));
  }

  async generatePDF(req: GeneratePDFRequest, cedible: boolean): Promise<APIResponse> {
    return this.doJSON(
      'POST',
      '/api/v1/pdfs/generate',
      { cedible: String(cedible) },
      stripIdempotency(req),
      withIdempotency(req.idempotencyKey)
    );
  }

  async createBusiness(req: CreateBusinessRequest): Promise<APIResponse> {
    return this.doJSON('POST', '/api/v1/businesses', undefined, stripIdempotency(req), withIdempotency(req.idempotencyKey));
  }

  async updateBusiness(id: string, req: UpdateBusinessRequest): Promise<APIResponse> {
    return this.doJSON('PUT', `/api/v1/businesses/${id}`, undefined, stripIdempotency(req), withIdempotency(req.idempotencyKey));
  }

  async uploadCertificate(businessID: string, req: UploadCertificateRequest): Promise<APIResponse> {
    return this.doJSON('PUT', `/api/v1/business/${businessID}/certificate`, undefined, req);
  }

  async getCertificateInfo(): Promise<APIResponse> {
    return this.doJSON('GET', '/api/v1/business/certificate-info');
  }

  async getMe(): Promise<APIResponse> {
    return this.doJSON('GET', '/api/v1/users/me');
  }

  async createPurchase(req: CreatePurchaseRequest): Promise<APIResponse> {
    return this.doJSON('POST', '/api/v1/purchases', undefined, stripIdempotency(req), withIdempotency(req.idempotencyKey));
  }

  async getNumerationSummary(): Promise<APIResponse> {
    return this.doJSON('GET', '/api/v1/numerations/summary');
  }

  async getLastUsedFolio(codeSII: string): Promise<APIResponse> {
    return this.doJSON('GET', '/api/v1/numerations/last-used-number', { code_sii: codeSII });
  }

  async uploadNumeration(req: UploadNumerationRequest): Promise<APIResponse> {
    return this.doJSON('PUT', '/api/v1/numerations', undefined, req);
  }

  async deleteNumeration(id: string): Promise<APIResponse> {
    return this.doJSON('DELETE', `/api/v1/numerations/${id}`);
  }

  private buildURL(route: string, query?: Record<string, string>): string {
    const url = new URL(route, `${this.baseURL}/`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private async doJSON(
    method: string,
    route: string,
    query?: Record<string, string>,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<APIResponse> {
    const headers: Record<string, string> = {
      'x-api-key': this.config.apiKey,
      Accept: 'application/json',
      'User-Agent': this.userAgent,
      ...extraHeaders
    };

    let payload: string | undefined;
    if (body !== undefined && body !== null) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const response = await this.fetchFn(this.buildURL(route, query), {
      method,
      headers,
      body: payload
    });

    const rawBody = await response.text();

    if (!response.ok) {
      throw new APIError(response.status, rawBody);
    }

    if (!rawBody) {
      return {};
    }

    try {
      return JSON.parse(rawBody) as APIResponse;
    } catch (error) {
      throw new Error(`integrafacturacion: decode response: ${(error as Error).message}`);
    }
  }
}

export function encodeDataDTE(value: unknown): string {
  return JSON.stringify(value);
}

function withIdempotency(idempotencyKey?: string): Record<string, string> | undefined {
  if (!idempotencyKey?.trim()) {
    return undefined;
  }
  return { 'idempotency-key': idempotencyKey };
}

function stripIdempotency<T extends { idempotencyKey?: string }>(value: T): Omit<T, 'idempotencyKey'> {
  const { idempotencyKey: _, ...rest } = value;
  return rest;
}

function isValidURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
