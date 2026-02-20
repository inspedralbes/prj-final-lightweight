import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { RoutineService } from './rotuine.service';
import { Routine } from './routine.model';

@Controller('/routines')
export class RoutineController {
  constructor(private readonly routineService: RoutineService) { }

  @Get()
  async getAllRoutines(): Promise<Routine[]> {
    return this.routineService.getAllRoutines();
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
}
