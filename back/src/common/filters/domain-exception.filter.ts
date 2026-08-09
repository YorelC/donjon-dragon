import {
  BadRequestException,
  Catch,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  type ArgumentsHost,
  type ExceptionFilter,
  type HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

import {
  DomainError,
  type DomainErrorKind,
} from '@kernel/domain/domain.error';

/**
 * Traduit toute DomainError en réponse HTTP. Monté en APP_FILTER : les
 * controllers n'ont plus un seul try/catch de traduction.
 *
 * La correspondance porte sur la NATURE de l'erreur, pas sur sa classe : ce
 * fichier n'a donc à connaître aucun module métier, et une nouvelle erreur de
 * domaine est correctement mappée sans y toucher.
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const exception = HTTP_EXCEPTION_BY_KIND[error.kind](error.message);
    const response = host.switchToHttp().getResponse<Response>();
    const body = exception.getResponse();

    // `code` n'est ajouté que si l'erreur en déclare un : le corps reste celui de
    // Nest pour toutes les autres, et le client n'a pas de champ fantôme à tester.
    response.status(exception.getStatus()).json(
      error.code === undefined ? body : { ...(body as object), code: error.code },
    );
  }
}

type HttpExceptionFactory = (message: string) => HttpException;

const HTTP_EXCEPTION_BY_KIND: Record<DomainErrorKind, HttpExceptionFactory> = {
  invalid: (message) => new BadRequestException(message),
  unauthorized: (message) => new UnauthorizedException(message),
  forbidden: (message) => new ForbiddenException(message),
  'not-found': (message) => new NotFoundException(message),
  conflict: (message) => new ConflictException(message),
};
