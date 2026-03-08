import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoachGuard } from '../auth/guards/coach.guard';

@Controller('session')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  // ⚠️ Rutas estáticas siempre antes que las dinámicas (:code)

  // Ruta PROTEGIDA: Obtener sesiones del coach autenticado
  @Get()
  @UseGuards(CoachGuard)
  async getCoachSessions(@Request() req: any) {
    return this.sessionService.getCoachSessions(req.user.userId);
  }

  // Ruta PROTEGIDA: Obtener sesiones del cliente en modo solitario
  @Get('my-sessions')
  @UseGuards(JwtAuthGuard)
  async getClientSessions(@Request() req: any) {
    return this.sessionService.getClientSessions(req.user.userId);
  }

  // Ruta PÚBLICA para acceder a una sesión por código
  @Get(':code')
  async getSessionByCode(@Param('code') code: string) {
    const session = await this.sessionService.getSessionByCode(code);
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }
    return session;
  }

  // Ruta PROTEGIDA: Crear sesión (coaches Y clientes en modo solitario)
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createSession(
    @Request() req: any,
    @Body() { routineId }: { routineId: number },
  ) {
    return this.sessionService.createSession(
      req.user.userId,
      req.user.role,
      routineId,
    );
  }

  // Ruta PROTEGIDA: Actualizar estado de sesión
  @Post(':code/status')
  @UseGuards(JwtAuthGuard)
  async updateSessionStatus(
    @Param('code') code: string,
    @Body() { status }: { status: 'PENDING' | 'ACTIVE' | 'COMPLETED' },
    @Request() req: any,
  ) {
    return this.sessionService.updateSessionStatus(
      code,
      status,
      req.user.userId,
      req.user.role,
    );
  }
}
