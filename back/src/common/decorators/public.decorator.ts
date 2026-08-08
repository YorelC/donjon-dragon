import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Ouvre une route au monde. Le JwtAuthGuard est monte en APP_GUARD : tout est
 * protege par defaut, et l'exception doit etre declaree explicitement ici.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
