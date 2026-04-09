const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/collaborations', require('./routes/collaborations'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/video-call', require('./routes/videoCall'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'Server is running' }));

app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join video call room
  socket.on('join-call', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', { userId, userName, socketId: socket.id });
    console.log(`${userName} joined room: ${roomId}`);
  });

  // Leave video call room
  socket.on('leave-call', ({ roomId, userId, userName }) => {
    socket.to(roomId).emit('user-left', { userId, userName });
    socket.leave(roomId);
    console.log(`${userName} left room: ${roomId}`);
  });

  // Toggle audio
  socket.on('toggle-audio', ({ roomId, userId, audioEnabled }) => {
    socket.to(roomId).emit('user-audio-toggled', { userId, audioEnabled });
  });

  // Toggle video
  socket.on('toggle-video', ({ roomId, userId, videoEnabled }) => {
    socket.to(roomId).emit('user-video-toggled', { userId, videoEnabled });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
