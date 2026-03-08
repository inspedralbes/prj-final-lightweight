import { io, Socket } from "socket.io-client";

// In development VITE_BACK_URL is an absolute URL (http://localhost:3000) so we
// connect directly to the backend. In production it is a relative path (/api)
// used only for HTTP calls; the socket must connect to the page origin so that
// nginx can proxy /socket.io/ to the backend with the correct namespace "/".
const backUrl = (import.meta.env.VITE_BACK_URL as string) || "";
const SOCKET_URL = backUrl.startsWith("http")
  ? backUrl
  : window.location.origin;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
});
