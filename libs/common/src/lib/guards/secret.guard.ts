import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const serviceKey = request.headers['x-service-key'];
    const internalSecret = this.config.get('INTERNAL_SECRET');

    // If no secret is configured (e.g. dev), we might skip or fail.
    // Let's require it for safety if the ENV variable is present.
    if (!internalSecret) {
      return true;
    }

    if (serviceKey !== internalSecret) {
      throw new UnauthorizedException('Invalid or missing X-Service-Key');
    }

    return true;
  }
}
