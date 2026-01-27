export function assignRoles(room, words) {
  const index = Math.floor(Math.random() * room.players.length);
  room.impostorId = room.players[index].id;

  room.players.forEach(player => {
    if (player.id === room.impostorId) {
      player.role = "impostor";
      player.word = words.palabra_impostor;
    } else {
      player.role = "player";
      player.word = words.palabra_real;
    }
  });
}
