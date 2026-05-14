import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from "@nestjs/common";
import { FriendInvitationsService } from "./friend-invitations.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateFriendInvitationDto } from "./dto/create-friend-invitation.dto";
import { UpdateFriendInvitationDto } from "./dto/update-friend-invitation.dto";

@Controller("friend-invitations")
export class FriendInvitationsController {
  constructor(private friendInvitationsService: FriendInvitationsService) {}

  @Post("send")
  @UseGuards(JwtAuthGuard)
  async sendInvitation(@Request() req: any, @Body() dto: CreateFriendInvitationDto) {
    return this.friendInvitationsService.createInvitation(req.user.userId, dto);
  }

  @Get("pending")
  @UseGuards(JwtAuthGuard)
  async getPending(@Request() req: any) {
    return this.friendInvitationsService.getPendingInvitations(req.user.userId);
  }

  @Get("sent")
  @UseGuards(JwtAuthGuard)
  async getSent(@Request() req: any) {
    return this.friendInvitationsService.getSentInvitations(req.user.userId);
  }

  @Patch(":id/accept")
  @UseGuards(JwtAuthGuard)
  async accept(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.friendInvitationsService.acceptInvitation(id, req.user.userId);
  }

  @Patch(":id/reject")
  @UseGuards(JwtAuthGuard)
  async reject(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.friendInvitationsService.rejectInvitation(id, req.user.userId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getById(@Param("id", ParseIntPipe) id: number) {
    return this.friendInvitationsService.getInvitationById(id);
  }
}