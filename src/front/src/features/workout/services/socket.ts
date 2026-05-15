import { io, Socket } from "socket.io-client";

const backUrl = (import.meta.env.VITE_BACK_URL as string) || "";
const SOCKET_URL = backUrl.startsWith("http")
  ? backUrl
  : window.location.origin;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
});

export const roomSocket: Socket = io(`${SOCKET_URL}/room`, {
  autoConnect: true,
});
