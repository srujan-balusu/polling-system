import { io } from "socket.io-client";

const getSocketUrl = () => {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000";
  }
  // in production, point at your Render backend:
  return "https://live-polling-system-2-gv26.onrender.com";
};


const socket = io(getSocketUrl(), {
  transports: ["websocket"],
  upgrade: false,
});

export default socket;
