'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** اتصال Socket.io با توکن JWT — singleton */
export function getSocket(token: string | null): Socket | null {
  if (!token) return null;
  if (socket?.connected) return socket;
  socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000', {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 3,
  });
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}
