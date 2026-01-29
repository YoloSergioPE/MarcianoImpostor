import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import registerSockets from "./sockets/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer() {
  const app = express();
  const server = http.createServer(app);

  // 👉 SERVIR FRONTEND
  app.use(express.static(path.join(__dirname, "../../frontend")));

  const io = new Server(server, {
    cors: { origin: "*" }
  });

  // Servir overlay
  app.use("/overlay", express.static(
    path.join(__dirname, "../frontend/overlay")
  ));
  
  registerSockets(io);

  server.listen(3001, () => {
    console.log("Backend corriendo en puerto 3001");
  });
}
