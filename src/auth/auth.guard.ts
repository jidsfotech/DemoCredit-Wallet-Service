import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Env } from '../common/env';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authorizationToken = this.extractTokenFromHeader(request);

    if (!authorizationToken) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      // Simulate JWT token check
      const token = this.configService.get<string>(Env.JWT_TOKEN);
      if (authorizationToken !== token) {
        throw new UnauthorizedException('Invalid token');
      }
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
