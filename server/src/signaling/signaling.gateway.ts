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
  private socketTokenMap = new Map<string, string>();
  private tokenSocketMap = new Map<string, string>();

  private resolveToken(socket: Socket): string {
    const handshakeToken =
      typeof socket.handshake.auth?.token === 'string'
        ? socket.handshake.auth.token
        : undefined;
    const token = handshakeToken?.trim();

    if (token) return token;

    this.logger.warn(
      `Client ${socket.id} missing token in handshake auth; falling back to socket.id`,
    );
    return socket.id;
  }

  handleConnection(socket: Socket) {
    const token = this.resolveToken(socket);
    this.socketTokenMap.set(socket.id, token);
    this.tokenSocketMap.set(token, socket.id);
    this.logger.debug(`Client connected: ${socket.id}, token: ${token}`);
  }

  handleDisconnect(socket: Socket) {
    const token = this.socketTokenMap.get(socket.id) ?? socket.id;
    this.logger.debug(`Client disconnected: ${socket.id}, token: ${token}`);
    const roomId = this.socketRoomMap.get(socket.id);
    if (roomId) {
      this.logger.debug(
        `Broadcasting token-disconnected for ${token} in room ${roomId}`,
      );
      socket.to(roomId).emit('token-disconnected', token);
      this.socketRoomMap.delete(socket.id);
    }

    this.socketTokenMap.delete(socket.id);
    this.tokenSocketMap.delete(token);
  }

  @SubscribeMessage('JOIN_ROOM')
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const token =
      this.socketTokenMap.get(socket.id) ?? this.resolveToken(socket);
    this.logger.debug(
      `Client ${socket.id} (token: ${token}) attempting to join room: ${roomId}`,
    );

    const room = this.server.sockets.adapter.rooms.get(roomId);
    const existingMembers: string[] = room
      ? Array.from(room).filter((id) => id !== socket.id)
      : [];
    const existingTokens = Array.from(
      new Set(
        existingMembers
          .map((memberSocketId) => this.socketTokenMap.get(memberSocketId))
          .filter((memberToken): memberToken is string => !!memberToken),
      ),
    );

    if (existingMembers.length >= 4) {
      this.logger.warn(`Room ${roomId} is full. Rejecting client ${socket.id}`);
      socket.emit('ROOM_FULL');
      return;
    }

    await socket.join(roomId);
    this.socketRoomMap.set(socket.id, roomId);

    this.logger.debug(
      `Client ${socket.id} (token: ${token}) joined room: ${roomId}. ` +
        `Total now: ${existingMembers.length + 1}`,
    );
    // Tell the new token about all existing members
    socket.emit('EXISTING_TOKENS', existingTokens);
  }

  /**
   * Generic signal relay — simple-peer sends all signal types
   * (offer, answer, ICE candidates) through this single event.
   */
  @SubscribeMessage('SEND_SIGNAL')
  handleSignal(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { targetToken: string; signal: string },
  ) {
    const { signal, targetToken } = data;
    const senderToken = this.socketTokenMap.get(socket.id) ?? socket.id;
    const targetSocketId = this.tokenSocketMap.get(targetToken);

    if (!targetSocketId) {
      this.logger.warn(
        `Cannot relay signal: target token ${targetToken} has no active socket`,
      );
      return;
    }

    this.logger.debug(
      `Relaying signal from token ${senderToken} (socket ${socket.id}) to token ${targetToken} (socket ${targetSocketId})`,
    );

    this.server.to(targetSocketId).emit('RECEIVE_SIGNAL', {
      senderToken,
      signal,
    });
  }
}
