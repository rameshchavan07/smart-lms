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

    let pubErrorLogged = false;
    let subErrorLogged = false;

    pubClient.on('error', (err) => {
      if (!pubErrorLogged) {
        console.warn('[Socket.io Redis Pub] Connection error (suppressing further logs):', err.message);
        pubErrorLogged = true;
      }
    });

    subClient.on('error', (err) => {
      if (!subErrorLogged) {
        console.warn('[Socket.io Redis Sub] Connection error (suppressing further logs):', err.message);
        subErrorLogged = true;
      }
    });

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

    socket.on('typing', (data: { targetId: string, isGroup: boolean }) => {
      const { targetId, isGroup } = data;
      const senderId = socket.data.user?.id;
      if (isGroup) {
        socket.to(`group_${targetId}`).emit('user_typing', { userId: senderId, groupId: targetId });
      } else {
        socket.to(targetId).emit('user_typing', { userId: senderId });
      }
    });

    socket.on('stop_typing', (data: { targetId: string, isGroup: boolean }) => {
      const { targetId, isGroup } = data;
      const senderId = socket.data.user?.id;
      if (isGroup) {
        socket.to(`group_${targetId}`).emit('user_stop_typing', { userId: senderId, groupId: targetId });
      } else {
        socket.to(targetId).emit('user_stop_typing', { userId: senderId });
      }
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
