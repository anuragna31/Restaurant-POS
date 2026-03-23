import { Server } from "socket.io";
import jwt from "jsonwebtoken";

export function initSockets(io: Server) {
  io.use((socket, next) => {
    const token =
      (typeof socket.handshake.auth?.token === "string" && socket.handshake.auth.token) ||
      (typeof socket.handshake.headers.authorization === "string" &&
      socket.handshake.headers.authorization.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.slice("Bearer ".length)
        : "");
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return next(new Error("Server misconfigured: JWT_SECRET missing"));
    if (!token) return next(new Error("Unauthorized"));
    try {
      const decoded = jwt.verify(token, jwtSecret) as { sub: string; role: string; name: string };
      socket.data.user = { id: decoded.sub, role: decoded.role, name: decoded.name };
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as { id: string; role: string } | undefined;
    if (user) {
      socket.join(`user:${user.id}`);
      socket.join(`role:${user.role}`);
    }
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

