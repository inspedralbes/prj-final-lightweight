import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoachGuard } from '../auth/guards/coach.guard';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // POST /invitations — Genera una nueva invitación (permitir usuarios autenticados)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateInvitationDto) {
    return this.invitationsService.create(req.user.userId, dto);
  }

  // POST /invitations/:code/accept — Cliente acepta la invitación
  @UseGuards(JwtAuthGuard)
  @Post(':code/accept')
  accept(@Req() req, @Param('code') code: string) {
    return this.invitationsService.accept(req.user.userId, code);
  }

  // PATCH /invitations/:id/revoke — Coach revoca una invitación pendiente
  @UseGuards(CoachGuard)
  @Patch(':id/revoke')
  revoke(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.invitationsService.revoke(req.user.userId, id);
  }
}
