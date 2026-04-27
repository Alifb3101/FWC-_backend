import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch()
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error('=== VALIDATION EXCEPTION DEBUG ===');
    this.logger.error('Request URL:', request.url);
    this.logger.error('Request Method:', request.method);
    this.logger.error('Request Body:', JSON.stringify(request.body, null, 2));
    this.logger.error('Exception:', exception);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: string[] | null = null;

    if (exception && typeof exception === 'object') {
      if ('getResponse' in exception) {
        const exceptionResponse = (exception as any).getResponse();
        this.logger.error('Exception Response:', exceptionResponse);

        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
          message = exceptionResponse.message || message;
          
          // Handle validation errors
          if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
            details = exceptionResponse.message;
            message = 'Validation failed';
            status = HttpStatus.BAD_REQUEST;
          }
          
          // Handle specific status codes
          if ('status' in exceptionResponse) {
            status = exceptionResponse.status;
          } else if ('statusCode' in exceptionResponse) {
            status = exceptionResponse.statusCode;
          }
        }
      }

      // Handle class-validator validation errors
      if (exception instanceof ValidationError || 
          (Array.isArray((exception as any).message) && 
           (exception as any).message.some((msg: any) => msg.constraints))) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Validation failed';
        details = this.formatValidationErrors(exception as any);
      }
    }

    this.logger.error('Final Status:', status);
    this.logger.error('Final Message:', message);
    this.logger.error('Final Details:', details);
    this.logger.error('=====================================');

    response.status(status).json({
      success: false,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  private formatValidationErrors(errors: ValidationError[]): any[] {
    return errors.map(error => ({
      field: error.property,
      constraints: error.constraints,
      children: error.children ? this.formatValidationErrors(error.children) : undefined,
    }));
  }
}
