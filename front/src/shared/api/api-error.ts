import { ApiErrorBodySchema, type DomainErrorCode } from "@donjon-dragon/shared";

/**
 * Erreur d'appel HTTP, dans un fichier à part.
 *
 * `api.ts` et `refresh.ts` en ont tous les deux besoin, et `api.ts` importe déjà
 * `refresh.ts` : la garder dans l'un ou l'autre fabriquerait un cycle.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Discriminant métier, quand le back en fournit un (cf. shared/error-schema). */
    public code?: DomainErrorCode,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Le corps d'erreur est lu quand il est exploitable, et ignoré sinon.
 *
 * `safeParse` plutôt qu'une confiance aveugle : une réponse d'erreur peut venir
 * d'un proxy, d'un 502 en HTML, ou n'avoir aucun corps. Le statut, lui, est
 * toujours là — l'échec de lecture ne doit donc jamais masquer l'échec réel.
 */
export async function toApiError(res: Response): Promise<ApiError> {
  const raw = await res.text();
  const parsed = ApiErrorBodySchema.safeParse(safeJsonParse(raw));

  if (!parsed.success) {
    return new ApiError(res.status, `API error ${res.status}: ${raw}`);
  }

  const { message, code } = parsed.data;
  return new ApiError(
    res.status,
    Array.isArray(message) ? message.join(", ") : message,
    code,
  );
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
