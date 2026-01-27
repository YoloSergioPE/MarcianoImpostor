import express from "express";
import http from "http";
import { Server } from "socket.io";
import registerSockets from "./sockets/index.js";

export function createServer() {
  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: "*" }
  });

  registerSockets(io);

  server.listen(3001, () => {
    console.log("Backend corriendo en puerto 3001");
  });
}
