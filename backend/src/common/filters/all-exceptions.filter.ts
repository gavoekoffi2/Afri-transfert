import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtre global : normalise toutes les erreurs en une enveloppe JSON cohérente,
 * masque les détails internes en production et journalise les 5xx.
 *
 * Format :
 * {
 *   "success": false,
 *   "error": { "code": "...", "message": "...", "details": [...] },
 *   "path": "...", "timestamp": "..."
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Une erreur interne est survenue';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message = (body.message as string) ?? exception.message;
        // class-validator renvoie un tableau de messages
        if (Array.isArray(body.message)) {
          message = 'Données de requête invalides';
          details = body.message;
          code = 'VALIDATION_ERROR';
        }
        if (typeof body.error === 'string') {
          code = this.toCode(body.error);
        }
      }
      if (code === 'INTERNAL_SERVER_ERROR') {
        code = this.statusToCode(status);
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      if (process.env.NODE_ENV === 'production') {
        message = 'Une erreur interne est survenue';
        details = undefined;
      } else if (exception instanceof Error) {
        message = exception.message;
      }
    }

    response.status(status).json({
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
    };
    return map[status] ?? 'ERROR';
  }

  private toCode(value: string): string {
    return value.toUpperCase().replace(/\s+/g, '_');
  }
}
