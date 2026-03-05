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
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173'],
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
  // Guardar progresos de cada usuario por sala
  // roomId -> (userId -> PartnerProgress)
  private roomProgress: Map<
    string,
    Map<string, {
      userId: string;
      progressPercentage: number;
      completedExercises: number[];
      currentExerciseIndex?: number;
      currentSet?: number;
      exerciseName?: string;
      totalSets?: number;
    }>
  > = new Map();
  // Configuración de sala: roomId -> { maxUsers, isSessionActive }
  private roomSettings: Map<string, { maxUsers: number; isSessionActive: boolean }> = new Map();

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
        this.server.to(roomId).emit('hostDisconnected', { userId, username: leaving?.username });
        // also broadcast a generic userLeft for toasts
        this.server.to(roomId).emit('userLeft', { userId, username: leaving?.username, wasHost: true });
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
        this.roomProgress.delete(roomId);
        // también limpiar la lista completa
        this.roomUsers.delete(roomId);
        // limpiar configuración de sala
        this.roomSettings.delete(roomId);
      } else {
        // guest disconnected, notify host alone
        const host = users.find((u) => u.isHost);
        if (host) {
          this.server.to(roomId).emit('guestDisconnected', { userId, username: leaving?.username });
        }
        // broadcast generic left
        this.server.to(roomId).emit('userLeft', { userId, username: leaving?.username, wasHost: false });
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
        // Inicializar configuración de sala por defecto
        this.roomSettings.set(roomId, { maxUsers: 2, isSessionActive: false });
      }

      const users = this.roomUsers.get(roomId)!;
      const settings = this.roomSettings.get(roomId)!;

      // Comprobar si la sesión ya ha empezado
      if (settings.isSessionActive) {
        client.emit('joinError', { reason: 'session_started' });
        return { success: false, error: 'Session already started' };
      }

      // Comprobar límite de usuarios
      if (users.length >= settings.maxUsers) {
        client.emit('joinError', { reason: 'room_full' });
        return { success: false, error: 'Room is full' };
      }

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
      client.emit('joinedRoom', { isHost, usersInRoom: users, maxUsers: settings.maxUsers });

      // si el usuario que entra no es host y existen progresos guardados,
      // reenviárselos inmediatamente para sincronización (todo el mapa)
      if (!isHost) {
        const roomMap = this.roomProgress.get(roomId);
        if (roomMap) {
          const all = Array.from(roomMap.values());
          client.emit('roomProgressUpdate', { allProgress: all });
        }
      }

      // broadcast de notificación de nueva unión
      this.server.to(roomId).emit('userJoined', { userId, username: username || `User-${userId}`, isHost });

      console.log(`📤 [Room] Emitiendo roomUsersUpdate a sala ${roomId}:`, users);
      this.server.to(roomId).emit('roomUsersUpdate', {
        usersInRoom: users,
      });
      // debug helper
      console.log('Emitiendo a la sala:', roomId, 'Usuarios:', users);
      // also log the fact we broadcast userJoined
      console.log('📣 [Room] userJoined emitido para', username || `User-${userId}`);


      return { success: true, isHost };
    } catch (error) {
      console.error('Error en joinRoom:', error);
      return { success: false, error: 'Failed to join room' };
    }
  }

  @SubscribeMessage('setMaxUsers')
  handleSetMaxUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; maxUsers: number },
  ) {
    const { roomId, maxUsers } = payload;
    if (maxUsers < 2 || maxUsers > 10) {
      return { success: false, error: 'Invalid maxUsers value' };
    }
    const settings = this.roomSettings.get(roomId);
    if (!settings) {
      return { success: false, error: 'Room not found' };
    }
    settings.maxUsers = maxUsers;
    this.server.to(roomId).emit('roomSettingsUpdate', { maxUsers });
    return { success: true };
  }

  @SubscribeMessage('startSession')
  handleStartSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; routine: any },
  ) {
    const { roomId, routine } = payload;
    // Marcar la sesión como activa
    const settings = this.roomSettings.get(roomId);
    if (settings) {
      settings.isSessionActive = true;
    }
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
      this.server.to(roomId).emit('hostDisconnected', { userId, username: leaving?.username });
      this.server.to(roomId).emit('userLeft', { userId, username: leaving?.username, wasHost: true });
      try {
        await this.prisma.invitation.update({
          where: { code: roomId },
          data: { status: InvitationStatus.REVOKED },
        });
      } catch {}
      this.roomProgress.delete(roomId);
      this.roomUsers.delete(roomId);
      this.roomSettings.delete(roomId);
    } else {
      this.server.to(roomId).emit('guestDisconnected', { userId, username: leaving?.username });
      this.server.to(roomId).emit('userLeft', { userId, username: leaving?.username, wasHost: false });
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
    // almacenar estado dentro del mapa por sala
    if (!this.roomProgress.has(roomId)) {
      this.roomProgress.set(roomId, new Map());
    }
    const progMap = this.roomProgress.get(roomId)!;
    progMap.set(userId, {
      userId,
      progressPercentage,
      completedExercises,
      currentExerciseIndex,
      currentSet,
      exerciseName,
      totalSets,
    });

    // broadcast global de todos los progresos
    const allProgress = Array.from(progMap.values());
    this.server.to(roomId).emit('roomProgressUpdate', { allProgress });
    // por compatibilidad seguimos enviando evento antiguo solo a otros
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
    // find username for toast
    const users = this.roomUsers.get(roomId) || [];
    const usr = users.find((u) => u.id === userId);
    client.to(roomId).emit('partnerFinished', { userId, finalStats });
    client.to(roomId).emit('userFinished', { userId, username: usr?.username, finalStats });
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

    // borrar su progreso si existía
    const progMap = this.roomProgress.get(roomId);
    if (progMap) {
      progMap.delete(userId);
    }

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
