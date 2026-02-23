import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Get,
  Put,
  Delete,
} from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoachGuard } from '../auth/guards/coach.guard';
import { CreateRoutineDto } from './dto/create-routine.dto';

@Controller('routines')
export class RoutinesController {
  constructor(private routinesService: RoutinesService) {}

  // ⚠️ IMPORTANTE: Las rutas estáticas SIEMPRE antes que las dinámicas (:id)
  // Si 'clients-options' estuviera DESPUÉS de ':id', NestJS lo trataría como un ID.

  @Get('clients-options')
  @UseGuards(CoachGuard)
  async getClientsOptions() {
    return this.routinesService.getClientsOptions();
  }

  // Endpoint para CLIENTES: devuelve las rutinas asignadas al usuario autenticado
  @Get('my-routines')
  @UseGuards(JwtAuthGuard)
  async getMyRoutines(@Request() req: any) {
    return this.routinesService.getClientRoutines(req.user.userId);
  }

  @Get()
  @UseGuards(CoachGuard)
  async listCoachRoutines(@Request() req: any) {
    return this.routinesService.getCoachRoutines(req.user.userId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.routinesService.getRoutineById(Number(id));
  }

  @Post('create')
  @UseGuards(CoachGuard)
  async create(@Request() req: any, @Body() body: CreateRoutineDto) {
    const coachId = req.user.userId;
    const { name, exercises, clientId } = body;
    return this.routinesService.createRoutine(
      coachId,
      name,
      exercises || [],
      clientId,
    );
  }

  @Put(':id/edit')
  @UseGuards(CoachGuard)
  async edit(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: CreateRoutineDto,
  ) {
    const coachId = req.user.userId;
    const { name, exercises, clientId } = body;
    return this.routinesService.updateRoutine(
      Number(id),
      coachId,
      name,
      exercises || [],
      clientId,
    );
  }

  @Delete(':id')
  @UseGuards(CoachGuard)
  async delete(@Request() req: any, @Param('id') id: string) {
    const coachId = req.user.userId;
    return this.routinesService.deleteRoutine(Number(id), coachId);
  }
}
