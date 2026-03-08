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
import { UpdateRoutineDto } from './dto/update-routine.dto';

@Controller('routines')
export class RoutinesController {
  constructor(private routinesService: RoutinesService) {}

  // ⚠️ IMPORTANTE: Las rutas estáticas SIEMPRE antes que las dinámicas (:id)
  // Si 'global' estuviera DESPUÉS de ':id', NestJS lo trataría como un ID.
  @Get('global')
  @UseGuards(JwtAuthGuard)
  async getGlobalRoutines() {
    return this.routinesService.getGlobalRoutines();
  }

  @Get('clients-options')
  @UseGuards(CoachGuard)
  async getClientsOptions(@Request() req: any) {
    return this.routinesService.getClientsOptions(req.user.userId);
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
    const routineId = Number(id);
    if (isNaN(routineId)) {
      return null; // O lanzar un BadRequestException
    }
    return this.routinesService.getRoutineById(routineId);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() body: CreateRoutineDto) {
    const { name, exercises, clientIds } = body;
    return this.routinesService.createRoutine(
      req.user,
      name,
      exercises || [],
      clientIds && clientIds.length > 0 ? clientIds : undefined,
    );
  }

  @Put(':id/edit')
  @UseGuards(JwtAuthGuard)
  async edit(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateRoutineDto,
  ) {
    const { name, exercises, clientIds } = body;
    return this.routinesService.updateRoutine(
      Number(id),
      req.user,
      name,
      exercises,
      clientIds,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.routinesService.deleteRoutine(Number(id), req.user);
  }
}
