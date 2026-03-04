import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('send')
  async sendMessage(
    @Request() req,
    @Body() body: { receiverId: number; text: string },
  ) {
    try {
      const senderId = req.user.userId;
      const message = await this.chatService.sendMessage(
        senderId,
        body.receiverId,
        body.text,
      );
      return message;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new HttpException(
        'Failed to send message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('unread')
  async getUnreadMessages(@Request() req) {
    try {
      const userId = req.user.userId;
      const messages = await this.chatService.getUnreadMessages(userId);
      return messages;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch messages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('mark-read')
  async markAsRead(@Body() body: { messageIds: number[] }) {
    try {
      await this.chatService.markAsRead(body.messageIds);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        'Failed to mark messages as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('conversation/:userId')
  async getConversation(@Request() req, @Param('userId') otherUserId: string) {
    try {
      const userId = req.user.userId;
      const messages = await this.chatService.getConversation(
        userId,
        parseInt(otherUserId),
      );
      return messages;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':messageId')
  async deleteMessage(@Request() req, @Param('messageId') messageId: string) {
    try {
      const userId = req.user.userId;
      await this.chatService.deleteMessage(parseInt(messageId), userId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        'Failed to delete message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
