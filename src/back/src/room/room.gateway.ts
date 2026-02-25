import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

interface RoomUser {
  id: string;
  socketId: string;
  username?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/room',
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Almacenar usuarios conectados por sala
  private roomUsers: Map<string, Map<string, RoomUser>> = new Map();
  // Mapear socketId -> userId y roomId
  private socketToUser: Map<string, { userId: string; roomId: string }> =
    new Map();

  handleConnection(client: Socket) {
    console.log(`🔌 [Room] Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ [Room] Cliente desconectado: ${client.id}`);
    const userInfo = this.socketToUser.get(client.id);
    if (userInfo) {
      const { userId, roomId } = userInfo;
      this.removeUserFromRoom(roomId, userId, client.id);
      this.socketToUser.delete(client.id);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userId: string; username?: string },
  ) {
    const { roomId, userId, username } = payload;

    try {
      // Añadir usuario a la sala
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Map());
      }

      const room = this.roomUsers.get(roomId)!;
      const user: RoomUser = {
        id: userId,
        socketId: client.id,
        username: username || `User-${userId}`,
      };

      room.set(userId, user);
      this.socketToUser.set(client.id, { userId, roomId });

      // Unir el cliente al room en socket.io
      client.join(roomId);

      // Obtener lista de usuarios actuales
      const usersInRoom = Array.from(room.values()).map((u) => ({
        id: u.id,
        username: u.username,
      }));

      // Notificar a todos en la sala (incluyendo el recién llegado) con la lista actualizada
      this.server.to(roomId).emit('roomUsersUpdate', {
        usersInRoom,
      });

      console.log(
        `👤 Usuario ${username || userId} se unió a sala ${roomId}. Total: ${usersInRoom.length}`,
      );

      return {
        success: true,
        usersInRoom,
      };
    } catch (error) {
      console.error('Error en joinRoom:', error);
      return { success: false, error: 'Failed to join room' };
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userId: string },
  ) {
    const { roomId, userId } = payload;
    this.removeUserFromRoom(roomId, userId, client.id);
    return { success: true };
  }

  @SubscribeMessage('getRoomUsers')
  handleGetRoomUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const { roomId } = payload;
    const room = this.roomUsers.get(roomId);
    if (!room) {
      return { success: true, usersInRoom: [] };
    }
    const usersInRoom = Array.from(room.values()).map((u) => ({
      id: u.id,
      username: u.username,
    }));
    return { success: true, usersInRoom };
  }

  private removeUserFromRoom(roomId: string, userId: string, socketId: string) {
    const room = this.roomUsers.get(roomId);
    if (!room) return;

    room.delete(userId);
    const usersInRoom = Array.from(room.values()).map((u) => ({
      id: u.id,
      username: u.username,
    }));

    // Notificar a todos en la sala con la lista actualizada
    this.server.to(roomId).emit('roomUsersUpdate', {
      usersInRoom,
    });

    // Limpiar si la sala está vacía
    if (room.size === 0) {
      this.roomUsers.delete(roomId);
    }

    console.log(`👤 Usuario ${userId} salió de sala ${roomId}`);
  }
}
