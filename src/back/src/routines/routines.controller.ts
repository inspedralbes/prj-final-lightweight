import { Controller, Post, Body, UseGuards, Request, Param, Get, Put } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoachGuard } from '../auth/guards/coach.guard';
import { CreateRoutineDto } from './dto/create-routine.dto';

@Controller('routines')
export class RoutinesController {
  constructor(private routinesService: RoutinesService) {}

  @Post('create')
  @UseGuards(CoachGuard)
  async create(@Request() req: any, @Body() body: CreateRoutineDto) {
    const coachId = req.user.userId;
    const { name, exercises } = body;
    return this.routinesService.createRoutine(coachId, name, exercises || []);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.routinesService.getRoutineById(Number(id));
  }

  @Put(':id/edit')
  @UseGuards(CoachGuard)
  async edit(@Request() req: any, @Param('id') id: string, @Body() body: CreateRoutineDto) {
    const coachId = req.user.userId;
    const { name, exercises } = body;
    return this.routinesService.updateRoutine(Number(id), coachId, name, exercises || []);
  }

  @Get()
  @UseGuards(CoachGuard)
  async listCoachRoutines(@Request() req: any) {
    return this.routinesService.getCoachRoutines(req.user.userId);
  }
}
