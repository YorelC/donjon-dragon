import { z } from 'zod';

/**
 * Discriminant machine d'une erreur métier, pour les seuls cas où le client doit
 * BRANCHER et pas seulement afficher.
 *
 * Le `message` d'une erreur est une phrase : il se reformule, se traduit, et ne
 * constitue pas un contrat — s'en servir pour décider, c'est coupler l'interface à
 * la rédaction du back. Un code, si.
 *
 * On ne déclare donc ici que ce qu'une interface doit réellement distinguer : deux
 * conflits d'inscription qui partagent le statut 409 mais ne désignent pas le même
 * champ du formulaire.
 */
export const DomainErrorCodeEnum = z.enum([
  'email-already-in-use',
  'display-name-already-taken',
]);

/** Objet — pour désigner un code sans l'écrire en dur. */
export const DOMAIN_ERROR_CODE = DomainErrorCodeEnum.enum;
/** Tuple — pour énumérer, valider, ou exhaustivité d'un Record. */
export const DOMAIN_ERROR_CODES = DomainErrorCodeEnum.options;

/**
 * Corps d'une réponse d'erreur.
 *
 * `code` est optionnel, et c'est structurel : la plupart des erreurs n'ont rien à
 * discriminer, et les exceptions levées par le framework lui-même (401 du guard,
 * 400 de la validation) n'en portent pas.
 */
export const ApiErrorBodySchema = z.object({
  statusCode: z.number(),
  message: z.union([z.string(), z.array(z.string())]),
  code: DomainErrorCodeEnum.optional(),
});

export type DomainErrorCode = z.infer<typeof DomainErrorCodeEnum>;
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;
