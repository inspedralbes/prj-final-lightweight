import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoutineService } from './rotuine.service';
import { Routine } from './routine.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('/routines')
export class RoutineController {
  constructor(private readonly routineService: RoutineService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllRoutines(@Request() req: any): Promise<Routine[]> {
    const { userId, role } = req.user;
    console.log('🔍 GET /routines - Usuario actual:', { userId, role });
    const routines = await this.routineService.getRoutinesByUser(userId, role);
    console.log('📦 Rutinas devueltas:', routines.length, 'rutinas');
    return routines;
  }

  @Get('clients-options')
  async getClientsOptions() {
    return this.routineService.getClients();
  }

  @Post()
  async postRoutine(
    @Body() body: { coachId: number; name: string; clientId?: number },
  ): Promise<Routine> {
    return this.routineService.createRoutine(
      body.coachId,
      body.name,
      body.clientId,
    );
  }

  @Get(':id')
  async getRoutineById(@Param('id') id: number): Promise<Routine | null> {
    return this.routineService.getRoutineById(id);
  }

  @Delete(':id')
  async deleteRoutine(@Param('id') id: number): Promise<Routine> {
    return this.routineService.deleteRoutine(id);
  }

  @Put(':id')
  async updateRoutine(
    @Param('id') id: number,
    @Body() body: { name: string; clientId?: number },
  ): Promise<Routine> {
    return this.routineService.updateRoutine(id, body.name, body.clientId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-routines/all')
  async getMyRoutines(@Request() req: any): Promise<Routine[]> {
    const { userId, role } = req.user;
    return this.routineService.getRoutinesByUser(userId, role);
  }
}
