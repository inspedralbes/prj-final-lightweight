import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat/chat.service';
import { AuthService } from '../auth/auth.service';
import dotenv from 'dotenv';

dotenv.config();

// Grace period before treating a disconnect as a permanent logout.
// 30 s covers page refreshes, brief network drops, and short tab switches.
const DISCONNECT_GRACE_MS = 30_000;

@WebSocketGateway({
  cors: {
    origin: true, // nginx restricts external access; allow any origin at WS level
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // userId -> Set of active socketIds (one per browser tab/device)
  private userSockets: Map<number, Set<string>> = new Map();
  private userOpenChats: Map<number, Set<string>> = new Map();
  // userId -> { timer, disconnectedSocketId }
  private disconnectTimers: Map<number, { timer: ReturnType<typeof setTimeout>; socketId: string }> = new Map();
  // userIds whose session was cleared by the grace timer; next register-user invalidates them
  private invalidatedUsers: Set<number> = new Set();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
  ) {}

  afterInit(_server: Server) {
    console.log(' Socket Gateway inicializado');
  }

  handleConnection(client: Socket) {
    console.log(` Cliente conectado: ${client.id}`);
    client.onAny((event, ...args) => {
      console.log(`[Socket ${client.id}] event "${event}" args:`, args);
    });
  }

  handleDisconnect(client: Socket) {
    console.log(` Cliente desconectado: ${client.id}`);

    for (const [userId, sockets] of this.userSockets.entries()) {
      if (!sockets.has(client.id)) continue;

      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }

      // Only start the grace timer when there are NO remaining sockets for this user.
      // If another tab is still open, the session stays alive.
      if (!this.userSockets.has(userId)) {
        // Cancel any existing timer before creating a new one (handles simultaneous disconnects).
        const existing = this.disconnectTimers.get(userId);
        if (existing) {
          clearTimeout(existing.timer);
          this.disconnectTimers.delete(userId);
        }

        const disconnectedSocketId = client.id;
        const timer = setTimeout(async () => {
          this.disconnectTimers.delete(userId);
          console.log(`[Auth] Grace period expired for user ${userId} — clearing session`);
          try {
            await this.authService.clearSession(userId);
            this.invalidatedUsers.add(userId);
            // Notify sockets already connected when the timer fires.
            const remainingSockets = this.userSockets.get(userId);
            if (remainingSockets && remainingSockets.size > 0) {
              for (const sid of remainingSockets) {
                console.log(`[Auth] Emitting session-invalidated to socket ${sid}`);
                this.server.to(sid).emit('session-invalidated');
              }
            }
          } catch {
            // user may have already logged out via beacon
          }
        }, DISCONNECT_GRACE_MS);

        this.disconnectTimers.set(userId, { timer, socketId: disconnectedSocketId });
        console.log(`[Auth] Grace timer started for user ${userId} (socket ${disconnectedSocketId})`);
      } else {
        console.log(`[Auth] User ${userId} still has ${this.userSockets.get(userId)!.size} socket(s) — no timer`);
      }
      break;
    }
  }

  @SubscribeMessage('register-user')
  handleRegisterUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ) {
    const id = Number(userId);
    if (!Number.isNaN(id)) {
      // Add this socket to the user's set
      const existing = this.userSockets.get(id) ?? new Set<string>();
      existing.add(client.id);
      this.userSockets.set(id, existing);

      // Any reconnect from this user cancels the pending logout timer.
      const pending = this.disconnectTimers.get(id);
      if (pending) {
        clearTimeout(pending.timer);
        this.disconnectTimers.delete(id);
        this.invalidatedUsers.delete(id);
        console.log(`[Auth] Reconnect for user ${id} (socket ${client.id}) — cancelled logout timer`);
      }

      console.log(`[Auth] Usuario ${id} registrado con socket ${client.id} (total: ${existing.size})`);

      // Session was cleared while all sockets were gone — invalidate on next reconnect.
      if (this.invalidatedUsers.has(id)) {
        this.invalidatedUsers.delete(id);
        console.log(`[Auth] Invalidated user ${id} reconnected — emitting session-invalidated to ${client.id}`);
        client.emit('session-invalidated');
      }
    } else {
      console.warn(`[Auth] register-user received invalid userId: ${userId} from socket ${client.id}`);
    }
  }

  // Helper: get any one socketId for a user (for unicast events)
  private getAnySocket(userId: number): string | undefined {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return undefined;
    return sockets.values().next().value;
  }

  // Helper: emit to all sockets of a user
  private emitToUser(userId: number, event: string, payload?: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const sid of sockets) {
      if (payload !== undefined) {
        this.server.to(sid).emit(event, payload);
      } else {
        this.server.to(sid).emit(event);
      }
    }
  }

  @SubscribeMessage('open-chat')
  handleOpenChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    if (!payload) {
      console.warn('[Chat] open-chat called with empty payload from', client.id);
      return;
    }
    const { userId, roomId, otherUserId }: { userId: number; roomId: string; otherUserId?: number } = payload;
    const set = this.userOpenChats.get(userId) || new Set<string>();
    set.add(roomId);
    this.userOpenChats.set(userId, set);
    console.log(`[Chat] Usuario ${userId} abrió chat ${roomId}`);

    if (otherUserId) {
      const otherHasChatOpen = this.userOpenChats.get(otherUserId)?.has(roomId) || false;
      const status = otherHasChatOpen ? 'connected' : 'connecting';
      console.log(`[Chat] informing otherUser ${otherUserId} that user ${userId} opened chat; status=${status}`);
      this.emitToUser(otherUserId, 'chat-partner-status', { roomId, userId, status });
    }
  }

  @SubscribeMessage('close-chat')
  handleCloseChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    if (!payload) {
      console.warn('[Chat] close-chat called with empty payload from', client.id);
      return;
    }
    const { userId, roomId, otherUserId }: { userId: number; roomId: string; otherUserId?: number } = payload;
    const set = this.userOpenChats.get(userId);
    if (set) {
      set.delete(roomId);
      if (set.size === 0) this.userOpenChats.delete(userId);
      else this.userOpenChats.set(userId, set);
    }
    console.log(`[Chat] Usuario ${userId} cerró chat ${roomId}`);

    if (otherUserId) {
      const otherHasChatOpen = this.userOpenChats.get(otherUserId)?.has(roomId) || false;
      const status = otherHasChatOpen ? 'connecting' : 'disconnected';
      console.log(`[Chat] informing otherUser ${otherUserId} that user ${userId} closed chat; status=${status}`);
      this.emitToUser(otherUserId, 'chat-partner-status', { roomId, userId, status });
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, roomId: string) {
    client.join(roomId);
    console.log(`[Signaling] Cliente ${client.id} se unió a la sala: ${roomId}`);
    const clientsInRoom = this.server.sockets.adapter.rooms.get(roomId) || new Set<string>();
    const others = Array.from(clientsInRoom).filter((id) => id !== client.id);
    client.emit('current-peers', { roomId, peers: others });
    this.server.to(roomId).emit('user-joined', { socketId: client.id, roomId });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, roomId: string) {
    client.leave(roomId);
    console.log(`[Signaling] Cliente ${client.id} abandonó la sala: ${roomId}`);
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

  @SubscribeMessage('get-chat-status')
  handleGetChatStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    if (!payload) {
      console.warn('[Chat] get-chat-status called with empty payload from', client.id);
      return;
    }
    const { roomId, userId, otherUserId }: { roomId: string; userId: number; otherUserId: number } = payload;
    const userHasChatOpen = this.userOpenChats.get(userId)?.has(roomId) || false;
    const otherHasChatOpen = this.userOpenChats.get(otherUserId)?.has(roomId) || false;
    const status = otherHasChatOpen ? 'connected' : 'connecting';
    console.log(`[Chat] Get chat status: user ${userId} (open=${userHasChatOpen}), other ${otherUserId} (open=${otherHasChatOpen}) → ${status}`);
    client.emit('chat-status', { roomId, status, otherUserConnected: otherHasChatOpen });
  }

  @SubscribeMessage('send-p2p-message')
  async handleSendP2PMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    if (!payload) {
      console.warn('[Chat] send-p2p-message called with empty payload from', client.id);
      return;
    }
    const { receiverId, text, senderId }: { receiverId: any; text: string; senderId: any } = payload;
    const recvId = Number(receiverId);
    const sendId = Number(senderId);
    console.log(`[Chat P2P] Mensaje de ${sendId} a ${recvId}: ${text}`);

    try {
      const message = await this.chatService.sendMessage(sendId, recvId, text);
      const senderUsername = message.sender?.username || 'Unknown';
      const roomId = `chat_client_${recvId}`;
      const receiverHasThisChatOpen = this.userOpenChats.get(recvId)?.has(roomId) || false;
      const receiverConnected = this.userSockets.has(recvId);

      if (receiverConnected) {
        console.log(`[Chat P2P] Delivering real-time message to user ${recvId}`);
        this.emitToUser(recvId, 'p2p-message', {
          from: senderId,
          fromUsername: senderUsername,
          text,
          messageId: message.id,
          timestamp: message.createdAt,
        });
        if (!receiverHasThisChatOpen) {
          this.emitToUser(recvId, 'p2p-message-notification', {
            from: senderId,
            fromUsername: senderUsername,
            text,
            messageId: message.id,
            timestamp: message.createdAt,
          });
        }
      } else {
        console.log(`[Chat P2P] Receptor ${recvId} no conectado; no se entregó el mensaje en tiempo real`);
      }
    } catch (error) {
      console.error('[Chat P2P] Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  // ─── Video-call signaling ──────────────────────────────────────────────────

  @SubscribeMessage('video-call-invite')
  handleVideoCallInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { callerId: number; calleeId: number; callerName: string; roomId: string },
  ) {
+-    const calleeSocket = this.getAnySocket(Number(payload.calleeId));
    if (calleeSocket) {
      this.server.to(calleeSocket).emit('video-call-invite', payload);
      client.emit('video-call-delivered', { callerId: payload.callerId, calleeId: payload.calleeId });
      console.log(`[VideoCall] Invite delivered from ${payload.callerId} to ${payload.calleeId}`);
    } else {
      client.emit('video-call-unavailable', { callerId: payload.callerId, calleeId: payload.calleeId });
      console.log(`[VideoCall] Callee ${payload.calleeId} offline — notified caller ${payload.callerId}`);
    }
  }

  @SubscribeMessage('video-call-accept')
  handleVideoCallAccept(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: { callerId: number; calleeId: number; roomId: string },
  ) {
    const callerSocket = this.getAnySocket(Number(payload.callerId));
    if (callerSocket) {
      this.server.to(callerSocket).emit('video-call-accept', payload);
      console.log(`[VideoCall] Accept from callee ${payload.calleeId} to caller ${payload.callerId}`);
    }
  }

  @SubscribeMessage('video-call-reject')
  handleVideoCallReject(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: { callerId: number; calleeId: number },
  ) {
    const callerSocket = this.getAnySocket(Number(payload.callerId));
    if (callerSocket) {
      this.server.to(callerSocket).emit('video-call-reject', payload);
      console.log(`[VideoCall] Reject from callee ${payload.calleeId} to caller ${payload.callerId}`);
    }
  }

  @SubscribeMessage('video-call-end')
  handleVideoCallEnd(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: { fromUserId: number; toUserId: number },
  ) {
    const toSocket = this.getAnySocket(Number(payload.toUserId));
    if (toSocket) {
      this.server.to(toSocket).emit('video-call-end', payload);
      console.log(`[VideoCall] End from ${payload.fromUserId} to ${payload.toUserId}`);
    }
  }

  emitCoachInvitation(
    clientId: number,
    payload: { coachId: number; coachName: string; invitationCode: string; invitationId: number },
  ) {
    const socketId = this.getAnySocket(clientId);
    if (socketId) {
      this.server.to(socketId).emit('coach-invitation', payload);
      console.log(`[CoachInvitation] Sent invite to client ${clientId} (socket ${socketId})`);
    } else {
      console.warn(`[CoachInvitation] Client ${clientId} is not connected — invitation not delivered in real time`);
    }
  }
}
