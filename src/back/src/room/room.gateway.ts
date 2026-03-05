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
import { PrismaService } from '../prisma/prisma.service';
import { InvitationStatus } from '@prisma/client';

interface RoomUser {
  id: string;
  socketId: string;
  username?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || '',
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter((v) => !!v) as string[],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/room',
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  // Almacenar usuarios conectados por sala: roomId -> Array de usuarios
  private roomUsers: Map<string, any[]> = new Map();
  // Mapear socketId -> { userId, roomId } para limpieza al desconectar
  private socketToUser: Map<string, { userId: string; roomId: string }> =
    new Map();
  // Guardar último progreso emitido por cada sala (generalmente del host)
  private roomLastProgress: Map<
    string,
    {
      userId: string;
      progressPercentage: number;
      completedExercises: number[];
      currentExerciseIndex?: number;
      currentSet?: number;
      exerciseName?: string;
      totalSets?: number;
    }
  > = new Map();

  handleConnection(client: Socket) {
    console.log(`🔌 [Room] Cliente conectado: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`❌ [Room] Cliente desconectado: ${client.id}`);
    const userInfo = this.socketToUser.get(client.id);
    if (userInfo) {
      const { userId, roomId } = userInfo;
      // determinar si era host antes de quitarlo
      const users = this.roomUsers.get(roomId) || [];
      const leaving = users.find((u) => u.id === userId);
      const wasHost = leaving?.isHost;

      // removemos al usuario
      this.removeUserFromRoom(roomId, userId, client.id);
      this.socketToUser.delete(client.id);

      if (wasHost) {
        // host destroyed the room
        this.server.to(roomId).emit('hostDisconnected');
        // marcar la invitación como cerrada en la base de datos
        try {
          await this.prisma.invitation.update({
            where: { code: roomId },
            data: { status: InvitationStatus.REVOKED },
          });
        } catch (e) {
          console.warn('[Room] no se pudo actualizar invitación al cerrar sala', e);
        }
        // limpiar cualquier progreso almacenado
        this.roomLastProgress.delete(roomId);
        // también limpiar la lista completa
        this.roomUsers.delete(roomId);
      } else {
        // guest disconnected, notify host alone
        // encontrar socket id del host y enviarle evento
        const host = users.find((u) => u.isHost);
        if (host) {
          // broadcast to room but host only will handle it client-side
          this.server.to(roomId).emit('guestDisconnected');
        }
      }
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

      // si el usuario que entra no es host y existen progresos guardados,
      // reenviárselos inmediatamente para sincronización
      if (!isHost) {
        const last = this.roomLastProgress.get(roomId);
        if (last) {
          client.emit('opponentProgressUpdate', last);
        }
      }

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
    // this legacy event still notifica un progreso básico; preferir `updateProgress`
    client.to(roomId).emit('opponentProgressUpdate', {
      userId,
      exerciseId,
      progress,
    });
    return { success: true };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userId: string },
  ) {
    const { roomId, userId } = payload;
    // basically trigger same logic as disconnect
    const users = this.roomUsers.get(roomId) || [];
    const leaving = users.find((u) => u.id === userId);
    const wasHost = leaving?.isHost;

    this.removeUserFromRoom(roomId, userId, client.id);
    this.socketToUser.delete(client.id);

    if (wasHost) {
      this.server.to(roomId).emit('hostDisconnected');
      try {
        await this.prisma.invitation.update({
          where: { code: roomId },
          data: { status: InvitationStatus.REVOKED },
        });
      } catch {}
      this.roomLastProgress.delete(roomId);
      this.roomUsers.delete(roomId);
    } else {
      this.server.to(roomId).emit('guestDisconnected');
    }

    return { success: true };
  }

  @SubscribeMessage('updateProgress')
  handleUpdateProgress(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      roomId: string;
      userId: string;
      progressPercentage: number;
      completedExercises: number[];
      currentExerciseIndex?: number;
      currentSet?: number;
      exerciseName?: string;
      totalSets?: number;
    },
  ) {
    const {
      roomId,
      userId,
      progressPercentage,
      completedExercises,
      currentExerciseIndex,
      currentSet,
      exerciseName,
      totalSets,
    } = payload;
    // almacenar último estado para recuperar a invitados que regresen
    this.roomLastProgress.set(roomId, {
      userId,
      progressPercentage,
      completedExercises,
      currentExerciseIndex,
      currentSet,
      exerciseName,
      totalSets,
    });
    // retransmitimos de inmediato a los demás en la sala usando el evento
    // que el front espera (`opponentProgressUpdate`) para mantener compatibilidad
    client.to(roomId).emit('opponentProgressUpdate', {
      userId,
      progressPercentage,
      completedExercises,
      currentExerciseIndex,
      currentSet,
      exerciseName,
      totalSets,
    });
    return { success: true };
  }

  @SubscribeMessage('sessionFinished')
  handleSessionFinished(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { roomId: string; userId: string; finalStats: any },
  ) {
    const { roomId, userId, finalStats } = payload;
    // reenviar al resto de la sala que este usuario terminó.
    client.to(roomId).emit('partnerFinished', { userId, finalStats });
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
