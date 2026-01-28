import { createRoom, getRoom } from "../game/roomManager.js";

export default function (io, socket) {

  socket.on("createRoom", ({ name, avatar, category }) => {
    const room = createRoom(socket.id, name, avatar, category);
    socket.join(room.id);
    io.to(room.id).emit("roomUpdate", room);
  });

  socket.on("joinRoom", ({ roomId, name, avatar }) => {
    const room = getRoom(roomId);
    if (!room || room.phase !== "lobby") return;

    room.players.push({
      id: socket.id,
      name,
      avatar,
      alive: true,
      role: null,
      word: null
    });

    socket.join(roomId);
    io.to(roomId).emit("roomUpdate", room);
  });
}
