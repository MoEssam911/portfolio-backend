import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { map, Observable } from 'rxjs';

type PaginatedResponseShape = {
  data: unknown;
  meta: unknown;
};

function isPaginatedResponse(data: unknown): data is PaginatedResponseShape {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    'meta' in data
  );
}

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        // -------------------------Preserve paginated meta----------------------------------

        if (isPaginatedResponse(data)) {
          return {
            success: true,

            data: data.data,

            meta: data.meta,
          };
        }

        // -------------------------Standard response----------------------------------

        return {
          success: true,

          data,
        };
      }),
    );
  }
}
