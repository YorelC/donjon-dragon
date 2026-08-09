import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodError, ZodType } from 'zod';

/**
 * Valide une entrée externe contre un schéma Zod et renvoie la valeur PARSÉE
 * (coercions et defaults appliqués, champs inconnus retirés par le schéma).
 *
 * Les DTO du projet sont des types inférés de Zod, pas des classes : il n'y a
 * donc rien à réfléchir pour un pipe global. Le schéma est passé explicitement,
 * via @ZodBody / @ZodQuery.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) throw new BadRequestException(formatIssues(result.error));

    return result.data;
  }
}

function formatIssues(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path} : ${issue.message}` : issue.message;
  });
}
