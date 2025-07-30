import { io } from "socket.io-client";

const getSocketUrl = () => {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000";
  }
  return undefined; // In production, connects to same host
};

const socket = io(getSocketUrl(), {
  transports: ["websocket"],
  upgrade: false,
});

export default socket;
