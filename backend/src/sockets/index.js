import registerRoomSockets from "./room.socket.js";
import registerGameSockets from "./game.socket.js";

export default function registerSockets(io) {
  io.on("connection", socket => {
    registerRoomSockets(io, socket);
    registerGameSockets(io, socket);
  });
}
