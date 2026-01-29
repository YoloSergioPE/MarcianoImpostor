// backend/src/game/gameFlow.js

export function startRound(room) {
  // Solo jugadores vivos
  const alivePlayers = room.players.filter(p => p.alive);

  // Recalcular orden de turnos
  room.turnOrder = alivePlayers.map(p => p.id);

  room.turnIndex = 0;
  room.wordsPlayed = [];

  room.phase = "round";
}

export function endRoundAndGoToVoting(room) {
  room.phase = "voting";
  room.turnIndex = 0;
}

export function afterVoting(room, eliminatedPlayerId) {
  // Eliminar jugador
  if (eliminatedPlayerId) {
    const player = room.players.find(p => p.id === eliminatedPlayerId);
    if (player) player.alive = false;
  }

  room.votes = {};
  room.wordsPlayed = [];
  room.round++;

  const alivePlayers = room.players.filter(p => p.alive);
  const impostorAlive = alivePlayers.some(p => p.id === room.impostorId);

  // 🏆 CONDICIONES DE VICTORIA
  if (eliminatedPlayerId === room.impostorId) {
    room.phase = "ended";
    room.winner = "players";
    return;
  }

  if (impostorAlive && alivePlayers.length <= 2) {
    room.phase = "ended";
    room.winner = "impostor";
    return;
  }

  if (room.round > room.maxRounds) {
    room.phase = "ended";
    room.winner = "impostor";
    return;
  }

  // Si nadie ganó → nueva ronda
  startRound(room);
}
