import 'dotenv/config';
import app from './app';
import { createServer } from 'http';
import { initSocket } from './utils/socket';

const PORT = process.env.PORT || 5000;

const server = createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
