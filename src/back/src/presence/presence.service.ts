import { Injectable } from "@nestjs/common";

@Injectable()
export class PresenceService {
  private onlineUsers: Map<number, Set<string>> = new Map();

  addSocket(userId: number, socketId: string): void {
    const sockets = this.onlineUsers.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.onlineUsers.set(userId, sockets);
  }

  removeSocket(userId: number, socketId: string): void {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
    } else {
      this.onlineUsers.set(userId, sockets);
    }
  }

  getOnlineUserIds(): number[] {
    return Array.from(this.onlineUsers.keys());
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }
}