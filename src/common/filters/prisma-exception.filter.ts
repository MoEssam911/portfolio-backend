import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;

    let message = 'Database error';

    switch (exception.code) {
      case 'P2000':
        message = 'Input value is too long for this field';
        break;

      case 'P2002': {
        status = HttpStatus.CONFLICT;

        const target = exception.meta?.target;

        const fields =
          Array.isArray(target) || typeof target === 'string'
            ? target.toString()
            : 'Field';

        message = `${fields} already exists`;

        break;
      }

      case 'P2003':
        message = 'Related record not found';
        break;

      case 'P2014':
        message = 'The change would violate a required relation';
        break;

      case 'P2025':
        status = HttpStatus.NOT_FOUND;

        message = 'Record not found';

        break;
    }

    response.status(status).json({
      success: false,

      statusCode: status,

      timestamp: new Date().toISOString(),

      path: request.url,

      message,
    });
  }
}
