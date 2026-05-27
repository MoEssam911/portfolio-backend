import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

import { Request, Response } from 'express';

type HttpExceptionResponseBody = {
  message?: string | string[];
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();

    let message = 'Internal server error';

    let errors: string[] = [];

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObject = exceptionResponse as HttpExceptionResponseBody;

      if (Array.isArray(responseObject.message)) {
        errors = responseObject.message;

        message = 'Validation failed';
      } else if (responseObject.message) {
        message = responseObject.message;
      }
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    response.status(status).json({
      success: false,

      statusCode: status,

      timestamp: new Date().toISOString(),

      path: request.url,

      message,

      ...(errors.length > 0 && { errors }),
    });
  }
}
