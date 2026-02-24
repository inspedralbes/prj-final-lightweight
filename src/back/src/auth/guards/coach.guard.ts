import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

// Este guard protege las rutas que requieren el rol COACH
@Injectable()
export class CoachGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    // Verificar que el usuario tenga el rol COACH
    if (user.role !== 'COACH') {
      console.log(
        `[CoachGuard] Acceso denegado. Usuario: ${user.username}, Rol: ${user.role}`,
      );
      throw new ForbiddenException('Only coaches can access this resource');
    }

    return user;
  }
}
