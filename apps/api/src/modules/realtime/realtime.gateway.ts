import { Injectable, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

/**
 * Gateway بلادرنگ گلوسیا
 * - هر کاربر پس از احراز هویت JWT به اتاق user:{id} می‌پیوندد
 * - رویدادها: glucose:new ، alert ، chat:message ، notification
 */
@Injectable()
@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'] },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('Realtime');

  constructor(private jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ??
        client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('no token');

      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      this.logger.log(`✅ اتصال کاربر ${payload.sub}`);
    } catch {
      client.disconnect(true); // اتصال بدون توکن معتبر قطع می‌شود
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) this.logger.log(`❌ قطع اتصال ${client.data.userId}`);
  }

  /** ارسال رویداد به یک کاربر مشخص */
  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  /**
   * سیگنالینگ WebRTC برای ویزیت تصویری
   * کلاینت‌ها offer/answer/ice را از طریق سرور رد و بدل می‌کنند؛
   * خود رسانه به‌صورت P2P منتقل می‌شود.
   */
  @SubscribeMessage('webrtc:signal')
  handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { to: string; data: unknown },
  ) {
    const from = client.data.userId as string | undefined;
    if (!from || !payload?.to) return;
    this.emitToUser(payload.to, 'webrtc:signal', { from, data: payload.data });
  }

  /** درخواست/پایان تماس تصویری */
  @SubscribeMessage('webrtc:call')
  handleCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { to: string; action: 'ring' | 'accept' | 'end' },
  ) {
    const from = client.data.userId as string | undefined;
    if (!from || !payload?.to) return;
    this.emitToUser(payload.to, 'webrtc:call', { from, action: payload.action });
  }
}
