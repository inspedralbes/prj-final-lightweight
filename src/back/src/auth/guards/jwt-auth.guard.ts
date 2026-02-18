import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Este guardse utiliza para proteger las rutas que requieren autenticación JWT.
// Al extender AuthGuard con la estrategia 'jwt', se asegura de que solo los usuarios autenticados puedan acceder a las rutas protegidas.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
