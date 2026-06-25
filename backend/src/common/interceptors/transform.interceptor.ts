import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Enveloppe toutes les réponses réussies dans `{ success: true, data }`,
 * sauf si le contrôleur renvoie déjà une enveloppe (présence de `success`).
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | T> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in (data as object)) {
          return data as T;
        }
        return { success: true, data };
      }),
    );
  }
}
