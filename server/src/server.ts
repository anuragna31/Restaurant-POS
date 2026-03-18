import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { initSockets } from "./sockets";
import { loadEnv } from "./config/loadEnv";

loadEnv();

const port = process.env.PORT || 4000;

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

initSockets(io);
app.set("io", io);

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
