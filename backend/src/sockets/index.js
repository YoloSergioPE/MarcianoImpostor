import registerRoomSockets from "./room.socket.js";
import registerGameSockets from "./game.socket.js";
import { getRoom } from "../game/roomManager.js";

export default function registerSockets(io) {
  io.on("connection", socket => {

    const { role, roomId } = socket.handshake.query;

    // ==========================
    // OVERLAY / SPECTATOR
    // ==========================
    if (role === "spectator" && roomId) {
      socket.join(roomId);

      const room = getRoom(roomId);
      if (room) {
        socket.emit("roomUpdate", room);
      }

      return; // ⛔ IMPORTANTE: no registrar sockets de juego
    }

    // ==========================
    // JUGADORES
    // ==========================
    registerRoomSockets(io, socket);
    registerGameSockets(io, socket);
  });
}
