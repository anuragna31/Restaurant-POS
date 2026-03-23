import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  const token = localStorage.getItem("token") || "";
  if (socket) {
    socket.auth = { token };
    return socket;
  }
  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
    transports: ["websocket"],
    autoConnect: true,
    auth: {
      token
    }
  });
  return socket;
}

