// api/socket.js
import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    io.on("connection", socket => {
      // … your socket event handlers …
    });
    res.socket.server.io = io;
  }
  res.end();
}
