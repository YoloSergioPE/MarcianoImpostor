export function getAlivePlayers(room) {
  return room.players.filter(p => p.alive);
}

export function nextTurn(room) {
  const alive = getAlivePlayers(room);
  room.turnIndex = (room.turnIndex + 1) % alive.length;
}
