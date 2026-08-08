import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';
import type { TokenServicePort } from '../../application/ports/token-service.port';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token);
  }
}
