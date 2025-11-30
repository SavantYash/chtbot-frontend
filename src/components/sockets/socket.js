import { io } from "socket.io-client";

export const socket = io("https://chtbot-backend-production.up.railway.app", {
  transports: ["websocket"],
  secure: true,
  autoConnect: false
})
