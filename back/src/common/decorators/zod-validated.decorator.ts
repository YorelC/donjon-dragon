import {
  Body,
  Param,
  Query,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { ZodType } from 'zod';

import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * @Body validé par un schéma Zod. À utiliser partout où @Body l'était :
 * sans schéma, un DTO n'est qu'un type effacé à la compilation et le corps de
 * la requête arrive tel quel, non vérifié.
 */
export const ZodBody = <T>(schema: ZodType<T>) => Body(new ZodValidationPipe(schema));

/** Idem pour la query string, qui est tout autant une entrée externe. */
export const ZodQuery = <T>(schema: ZodType<T>) => Query(new ZodValidationPipe(schema));

/** Idem pour un en-tête HTTP nommé. */
export function ZodHeader<T>(property: string, schema: ZodType<T>): ParameterDecorator {
  const header = createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<HeaderRequest>();
    const value = request.headers[property.toLowerCase()];
    return new ZodValidationPipe(schema).transform(value);
  });
  return header();
}

interface HeaderRequest {
  headers: Record<string, unknown>;
}

/**
 * Idem pour un segment d'URL dont le vocabulaire est fermé — une clé de classe,
 * pas un identifiant. Sans schéma, `@Param('classKey')` livre au use-case une
 * chaîne quelconque qui n'ira chercher aucune donnée de référence.
 */
export const ZodParam = <T>(property: string, schema: ZodType<T>) =>
  Param(property, new ZodValidationPipe(schema));
