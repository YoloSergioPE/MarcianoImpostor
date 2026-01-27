import { createRoom, getRoom } from "../game/roomManager.js";

export default function (io, socket) {

  socket.on("createRoom", ({ name, category }) => {
    const room = createRoom(socket.id, name, category);
    socket.join(room.id);
    io.to(room.id).emit("roomUpdate", room);
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    const room = getRoom(roomId);
    if (!room || room.phase !== "lobby") return;

    room.players.push({
      id: socket.id,
      name,
      alive: true,
      role: null,
      word: null
    });

    socket.join(roomId);
    io.to(roomId).emit("roomUpdate", room);
  });
}
