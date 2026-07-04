import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { REDIS_URL } from '../config/redis';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // For development, allow all origins
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  try {
    const pubClient = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => console.warn('[Socket.io Redis Pub] Error:', err.message));
    subClient.on('error', (err) => console.warn('[Socket.io Redis Sub] Error:', err.message));

    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Socket.io] Redis adapter configured successfully.');
  } catch (err: unknown) {
    console.warn('[Socket.io] Failed to configure Redis adapter.', err instanceof Error ? err.message : String(err));
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
      socket.data.user = decoded; // { id, email, role }
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.data.user?.id})`);

    // Join a room specifically for this user to receive private notifications
    if (socket.data.user?.id) {
      socket.join(socket.data.user.id);
    }

    // Optionally join rooms for enrolled courses to receive course-wide announcements
    socket.on('join_course', (courseId: string) => {
      socket.join(`course_${courseId}`);
      console.log(`User ${socket.data.user?.id} joined course_${courseId}`);
    });

    socket.on('join_group', (groupId: string) => {
      socket.join(`group_${groupId}`);
      console.log(`User ${socket.data.user?.id} joined group_${groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
