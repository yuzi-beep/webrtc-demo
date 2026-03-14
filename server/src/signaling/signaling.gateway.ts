import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  OnGatewayConnection,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SignalingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SignalingGateway.name);

  // Track which room each socket belongs to
  private socketRoomMap = new Map<string, string>();

  handleConnection(socket: Socket) {
    this.logger.debug(`Client connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.debug(`Client disconnected: ${socket.id}`);
    const roomId = this.socketRoomMap.get(socket.id);
    if (roomId) {
      this.logger.debug(
        `Broadcasting user-disconnected for ${socket.id} in room ${roomId}`,
      );
      socket.to(roomId).emit('user-disconnected', socket.id);
      this.socketRoomMap.delete(socket.id);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomId: string,
  ) {
    this.logger.debug(`Client ${socket.id} attempting to join room: ${roomId}`);

    const room = this.server.sockets.adapter.rooms.get(roomId);
    const existingMembers: string[] = room ? Array.from(room) : [];

    if (existingMembers.length >= 4) {
      this.logger.warn(`Room ${roomId} is full. Rejecting client ${socket.id}`);
      socket.emit('room-full');
      return;
    }

    await socket.join(roomId);
    this.socketRoomMap.set(socket.id, roomId);

    this.logger.debug(
      `Client ${socket.id} joined room: ${roomId}. ` +
        `Total now: ${existingMembers.length + 1}`,
    );

    // Notify existing members that a new user has connected
    socket.to(roomId).emit('user-connected', socket.id);

    // Tell the new user about all existing members
    socket.emit('existing-users', existingMembers);
  }

  /**
   * Generic signal relay — simple-peer sends all signal types
   * (offer, answer, ICE candidates) through this single event.
   */
  @SubscribeMessage('signal')
  handleSignal(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { targetId: string; signal: string },
  ) {
    const { signal, targetId } = data;
    this.logger.debug(`Relaying signal from ${socket.id} to ${targetId}`);

    this.server.to(targetId).emit('signal', {
      senderId: socket.id,
      signal,
    });
  }
}
