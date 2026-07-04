import 'dotenv/config';
import app from './app';
import { createServer } from 'http';
import { initSocket } from './utils/socket';
import redis from './config/redis';

const PORT = process.env.PORT || 5000;

const server = createServer(app);
initSocket(server);

// Connect Redis (non-blocking — app continues even if Redis is unavailable)
redis.connect().catch(() => { /* handled via redis 'error' event listener */ });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
