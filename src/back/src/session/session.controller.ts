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

  // Ruta PÚBLICA para acceder a una sesión
  @Get(':code')
  async getSessionByCode(@Param('code') code: string) {
    const session = await this.sessionService.getSessionByCode(code);
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }
    return session;
  }

  // Ruta PROTEGIDA: Crear sesión (solo coaches)
  @Post('create')
  @UseGuards(CoachGuard)
  async createSession(
    @Request() req: any,
    @Body() { routineId }: { routineId: number },
  ) {
    const coachId = req.user.userId;
    const session = await this.sessionService.createSession(coachId, routineId);
    return session;
  }

  // Ruta PROTEGIDA: Obtener sesiones del coach
  @Get()
  @UseGuards(CoachGuard)
  async getCoachSessions(@Request() req: any) {
    const coachId = req.user.userId;
    const sessions = await this.sessionService.getCoachSessions(coachId);
    return sessions;
  }

  // Ruta PROTEGIDA: Actualizar estado de sesión
  @Post(':code/status')
  @UseGuards(CoachGuard)
  async updateSessionStatus(
    @Param('code') code: string,
    @Body() { status }: { status: 'PENDING' | 'ACTIVE' | 'COMPLETED' },
    @Request() req: any,
  ) {
    // Verificar que la sesión pertenece al coach
    const session = await this.sessionService.getSessionByCode(code);
    if (!session || session.coachId !== req.user.userId) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    const updatedSession = await this.sessionService.updateSessionStatus(
      code,
      status,
    );
    return updatedSession;
  }
}
