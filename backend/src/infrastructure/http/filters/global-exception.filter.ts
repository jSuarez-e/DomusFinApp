// backend/src/infrastructure/http/filters/global-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let detail = 'An unexpected error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as Record<string, unknown>).message as string || exception.message;
        detail = (exceptionResponse as Record<string, unknown>).error as string || 'Http Error';
      }
    } else {
      // Log the actual exception for internal debugging but DO NOT expose it
      this.logger.error(`[Internal Error] on ${request.url}:`, exception);
    }

    // Format RFC 7807 Problem Details
    response.status(status).json({
      type: `https://httpstatuses.com/${status}`,
      title: message,
      status: status,
      detail: detail,
      instance: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
