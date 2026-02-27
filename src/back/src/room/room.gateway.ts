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

  // Almacenar usuarios conectados por sala: roomId -> Array de usuarios
  private roomUsers: Map<string, any[]> = new Map();
  // Mapear socketId -> { userId, roomId } para limpieza al desconectar
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
    @MessageBody() payload: { roomId: string; userId: string; username?: string; isHost?: boolean },
  ) {
    console.log('📥 [Room] joinRoom recibido:', payload);
    const { roomId, userId, username, isHost: requestedIsHost } = payload;

    try {
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, []);
      }

      const users = this.roomUsers.get(roomId)!;
      const userExists = users.find((u) => u.id === userId);

      let isHost = requestedIsHost ?? false;

      if (!userExists) {
        users.push({
          id: userId,
          username: username || `User-${userId}`,
          isHost,
        });
      } else {
        // Actualizar el estado de host si el usuario ya existía pero cambió su rol
        userExists.isHost = isHost;
      }

      this.socketToUser.set(client.id, { userId, roomId });
      client.join(roomId);

      // Notificar al usuario su rol y lista actualizada
      client.emit('joinedRoom', { isHost, usersInRoom: users });

      console.log(`📤 [Room] Emitiendo roomUsersUpdate a sala ${roomId}:`, users);
      this.server.to(roomId).emit('roomUsersUpdate', {
        usersInRoom: users,
      });

      return { success: true, isHost };
    } catch (error) {
      console.error('Error en joinRoom:', error);
      return { success: false, error: 'Failed to join room' };
    }
  }

  @SubscribeMessage('startSession')
  handleStartSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; routine: any },
  ) {
    const { roomId, routine } = payload;
    // Emitir a todos que la sesión comienza (esto activará la cuenta atrás en el front)
    this.server.to(roomId).emit('sessionStarting', { routine });
    return { success: true };
  }

  @SubscribeMessage('exerciseCompleted')
  handleExerciseCompleted(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userId: string; exerciseId: number; progress: number },
  ) {
    const { roomId, userId, exerciseId, progress } = payload;
    // Notificar al oponente
    client.to(roomId).emit('opponentProgressUpdate', {
      userId,
      exerciseId,
      progress,
    });
    return { success: true };
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

  @SubscribeMessage('updateProgress')
  handleUpdateProgress(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userId: string; progressPercentage: number; completedExercises: number[] },
  ) {
    const { roomId, userId, progressPercentage, completedExercises } = payload;
    // Hacer broadcast a todos en la sala EXCEPTO al emisor (o a todos, según se prefiera)
    // Usualmente para 'partnerProgress' queremos que otros lo vean
    client.to(roomId).emit('partnerProgress', {
      userId,
      progressPercentage,
      completedExercises,
    });
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
    const users = this.roomUsers.get(roomId);
    if (!users) return;

    // Filtrar el usuario que sale
    const updatedUsers = users.filter((u) => u.id !== userId);

    if (updatedUsers.length === 0) {
      this.roomUsers.delete(roomId);
    } else {
      this.roomUsers.set(roomId, updatedUsers);
    }

    // Notificar a todos en la sala con la lista actualizada
    console.log(`📤 [Room] Emitiendo roomUsersUpdate (por salida) a sala ${roomId}:`, updatedUsers);
    this.server.to(roomId).emit('roomUsersUpdate', {
      usersInRoom: updatedUsers,
    });

    console.log(`👤 Usuario ${userId} salió de sala ${roomId}`);
  }
}
