import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from '../04-infrastructure/token/jwt-token.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TierGuard } from './guards/tier.guard';
import { TOKEN_SERVICE } from './auth.tokens';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

@Module({
  imports: [JwtModule.register({ secret: JWT_SECRET })],
  providers: [
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    JwtAuthGuard,
    TierGuard,
  ],
  exports: [TOKEN_SERVICE, JwtAuthGuard, TierGuard],
})
export class AuthGuardsModule {}
