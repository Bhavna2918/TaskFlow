import app from './app';
import { createServer } from 'http';
import connectDB from './config/db';
import { initSocket } from './socket';

const server = createServer(app);

// Connect to Database
connectDB();

// Initialize Socket.io
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
