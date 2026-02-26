import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import dotenv from 'dotenv';

dotenv.config();

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL], // IMPORTANTE: Permite que el Frontend se conecte desde otro puerto
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, string> = new Map(); // userId -> socketId
  private userOpenChats: Map<number, Set<string>> = new Map(); // userId -> set of roomIds currently open

  constructor(private chatService: ChatService) {}

  afterInit(server: Server) {
    console.log('✅ Socket Gateway inicializado');
  }

  handleConnection(client: Socket) {
    console.log(`🔌 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Cliente desconectado: ${client.id}`);
    // Remover del mapa de usuarios
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        // limpiar chats abiertos de este usuario
        this.userOpenChats.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('register-user')
  handleRegisterUser(
    @ConnectedSocket() client: Socket,
    userId: number,
  ) {
    const id = Number(userId);
    if (!Number.isNaN(id)) {
      this.userSockets.set(id, client.id);
      console.log(`[Auth] Usuario ${id} registrado con socket ${client.id}`);
    } else {
      console.warn(`[Auth] register-user received invalid userId: ${userId} from socket ${client.id}`);
    }
  }

  @SubscribeMessage('open-chat')
  handleOpenChat(
    @ConnectedSocket() client: Socket,
    { userId, roomId }: { userId: number; roomId: string },
  ) {
    const set = this.userOpenChats.get(userId) || new Set<string>();
    set.add(roomId);
    this.userOpenChats.set(userId, set);
    console.log(`[Chat] Usuario ${userId} abrió chat ${roomId}`);
  }

  @SubscribeMessage('close-chat')
  handleCloseChat(
    @ConnectedSocket() client: Socket,
    { userId, roomId }: { userId: number; roomId: string },
  ) {
    const set = this.userOpenChats.get(userId);
    if (set) {
      set.delete(roomId);
      if (set.size === 0) this.userOpenChats.delete(userId);
      else this.userOpenChats.set(userId, set);
    }
    console.log(`[Chat] Usuario ${userId} cerró chat ${roomId}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, roomId: string) {
    client.join(roomId);
    console.log(`[Signaling] Cliente ${client.id} se unió a la sala: ${roomId}`);
    // Obtener lista de sockets ya presentes (excepto el que acaba de entrar)
    const clientsInRoom = this.server.sockets.adapter.rooms.get(roomId) || new Set<string>();
    const others = Array.from(clientsInRoom).filter((id) => id !== client.id);
    // responder al remitente con los existentes
    client.emit('current-peers', { roomId, peers: others });
    // Notificar a TODOS en la sala (incluido el nuevo) que la sala se ha actualizado
    this.server.to(roomId).emit('user-joined', { socketId: client.id, roomId });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, roomId: string) {
    client.leave(roomId);
    console.log(`[Signaling] Cliente ${client.id} abandonó la sala: ${roomId}`);
    // Notificar a los restantes en la sala que alguien se fue
    this.server.to(roomId).emit('user-left', { socketId: client.id, roomId });
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, { roomId, offer }: { roomId: string; offer: any }) {
    console.log(`[Signaling] Reenviando OFFER en sala ${roomId} de ${client.id}`);
    client.to(roomId).emit('offer', offer);
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, { roomId, answer }: { roomId: string; answer: any }) {
    console.log(`[Signaling] Reenviando ANSWER en sala ${roomId} de ${client.id}`);
    client.to(roomId).emit('answer', answer);
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(client: Socket, { roomId, candidate }: { roomId: string; candidate: any }) {
    console.log(`[Signaling] Reenviando ICE en sala ${roomId} de ${client.id}`);
    client.to(roomId).emit('ice-candidate', candidate);
  }

  @SubscribeMessage('send-p2p-message')
  async handleSendP2PMessage(
    @ConnectedSocket() client: Socket,
    { receiverId, text, senderId }: { receiverId: any; text: string; senderId: any },
  ) {
    const recvId = Number(receiverId);
    const sendId = Number(senderId);
    console.log(`[Chat P2P] Mensaje de ${sendId} a ${recvId}: ${text}`);
    
    try {
      // Guardar el mensaje en la BD
      const message = await this.chatService.sendMessage(sendId, recvId, text);
      const senderUsername = message.sender?.username || 'Unknown';

      // Si el receptor está conectado, enviarle mensaje y posiblemente notificación
      const receiverSocketId = this.userSockets.get(recvId);
      const roomId = `chat_client_${recvId}`;
      const receiverOpenRooms = this.userOpenChats.get(recvId);
      const receiverHasThisChatOpen = receiverOpenRooms ? receiverOpenRooms.has(roomId) : false;

      if (receiverSocketId) {
        // enviar siempre el mensaje real-time para que aparezca en la ventana si está abierta
        this.server.to(receiverSocketId).emit('p2p-message', {
          from: senderId,
          fromUsername: senderUsername,
          text: text,
          messageId: message.id,
          timestamp: message.createdAt,
        });

        // enviar notificación sólo si el receptor NO tiene abierto este chat
        if (!receiverHasThisChatOpen) {
          this.server.to(receiverSocketId).emit('p2p-message-notification', {
            from: senderId,
            fromUsername: senderUsername,
            text: text,
            messageId: message.id,
            timestamp: message.createdAt,
          });
        }
      }
    } catch (error) {
      console.error('[Chat P2P] Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}

