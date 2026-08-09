import { Body, Query } from '@nestjs/common';
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
