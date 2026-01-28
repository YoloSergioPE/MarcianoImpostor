import { rooms } from "../store/rooms.js";
import { nanoid } from "nanoid";

export function createRoom(hostSocketId, hostName, avatar, category) {
  const roomId = nanoid(6);

  const room = {
    id: roomId,
    hostId: hostSocketId,
    category,
    phase: "lobby",
    round: 1,
    maxRounds: 5,
    turnIndex: 0,
    players: [
      {
        id: hostSocketId,
        name: hostName,
        avatar,              // 🔥 CLAVE
        alive: true,
        role: null,
        word: null
      }
    ],
    wordsPlayed: [],
    votes: {},
    impostorId: null
  };

  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}
