import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("search")
  @UseGuards(JwtAuthGuard)
  async searchUsers(
    @Query("q") query: string,
    @Request() req: any,
  ) {
    return this.usersService.searchOnlineUsers(query, req.user.userId);
  }
}