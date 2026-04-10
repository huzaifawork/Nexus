const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");
const { sanitizeInputs } = require("./middleware/sanitize");

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

// 🔒 Security Middleware: Sanitize inputs to prevent NoSQL injection and XSS
app.use(sanitizeInputs);

// Make io accessible to routes
app.set("io", io);

// Static files for document downloads
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/collaborations", require("./routes/collaborations"));
app.use("/api/meetings", require("./routes/meetings"));
app.use("/api/video-call", require("./routes/videoCall"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/signatures", require("./routes/signatures"));
app.use("/api/payments", require("./routes/payments"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "Server is running" }));

app.use(errorHandler);

// Socket.IO connection handling
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-call", ({ roomId, userId, userName }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    const usersInRoom = rooms[roomId].map(({ userId: uid, socketId }) => ({
      userId: uid,
      socketId,
    }));
    socket.emit("all-users", usersInRoom);

    rooms[roomId].push({ userId, socketId: socket.id });
    socket.join(roomId);
    socket
      .to(roomId)
      .emit("user-joined", { userId, userName, socketId: socket.id });
    console.log(
      `${userName} (${userId}) joined room: ${roomId} with socket: ${socket.id}`,
    );
  });

  socket.on("sending-signal", ({ userToSignal, callerId, signal }) => {
    io.to(userToSignal).emit("user-joined", {
      signal,
      userId: callerId,
      socketId: socket.id,
    });
  });

  socket.on("returning-signal", ({ signal, callerId }) => {
    io.to(callerId).emit("receiving-signal", { signal, callerId: socket.id });
  });

  socket.on("leave-call", ({ roomId, userId, userName }) => {
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((u) => u.userId !== userId);
    }
    socket
      .to(roomId)
      .emit("user-left", { userId, userName, socketId: socket.id });
    socket.leave(roomId);
    console.log(`${userName} left room: ${roomId}`);
  });

  socket.on("toggle-audio", ({ roomId, userId, audioEnabled }) => {
    socket.to(roomId).emit("user-audio-toggled", { userId, audioEnabled });
  });

  socket.on("toggle-video", ({ roomId, userId, videoEnabled }) => {
    socket.to(roomId).emit("user-video-toggled", { userId, videoEnabled });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
