import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CoachGuard } from '../auth/guards/coach.guard';
import { ClientGuard } from '../auth/guards/client.guard';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // Coach: list of clients with activity summary
  @Get('coach/clients')
  @UseGuards(CoachGuard)
  async getCoachClients(@Request() req: any) {
    return this.progressService.getCoachClientsSummary(req.user.userId);
  }

  // Coach: session history for a specific client
  @Get('coach/client/:clientId')
  @UseGuards(CoachGuard)
  async getCoachClientHistory(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Request() req: any,
  ) {
    return this.progressService.getCoachClientSessionHistory(
      req.user.userId,
      clientId,
    );
  }

  // Client: own session history (solo + co-op)
  @Get('client/sessions')
  @UseGuards(ClientGuard)
  async getClientSessions(@Request() req: any) {
    return this.progressService.getClientOwnSessionHistory(req.user.userId);
  }

  // Client: aggregated workout statistics
  @Get('client/stats')
  @UseGuards(ClientGuard)
  async getClientStats(@Request() req: any) {
    return this.progressService.getClientStats(req.user.userId);
  }
}
