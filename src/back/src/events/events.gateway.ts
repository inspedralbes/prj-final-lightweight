import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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

  afterInit(server: Server) {
    console.log('✅ Socket Gateway inicializado');
  }

  handleConnection(client: Socket) {
    console.log(`🔌 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, roomId: string) {
    client.join(roomId);
    console.log(`[Signaling] Cliente ${client.id} se unió a la sala: ${roomId}`);
    // Notificar a TODOS en la sala (incluido el nuevo) que la sala se ha actualizado
    this.server.to(roomId).emit('user-joined', { socketId: client.id, roomId });
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
}
