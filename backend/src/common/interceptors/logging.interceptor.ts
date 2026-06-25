import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Journalise chaque requête HTTP avec sa durée. Les corps ne sont jamais journalisés
 * (évite la fuite de données sensibles : mots de passe, numéros, secrets).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${method} ${url} ${Date.now() - start}ms`);
      }),
    );
  }
}
