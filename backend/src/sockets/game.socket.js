import { getRoom } from "../game/roomManager.js";
import { assignRoles } from "../game/roles.js";
import { generateWords } from "../ai/wordGenerator.js";
import { isValidWord } from "../utils/validators.js";
import { countVotes } from "../game/voting.js";

export default function (io, socket) {

  // ==========================
  // INICIAR PARTIDA
  // ==========================
  socket.on("startGame", async ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || socket.id !== room.hostId) return;

    // --------------------------
    // Inicialización general
    // --------------------------
    room.roleConfirmed = {};
    room.phase = "role";
    room.round = 1;
    room.turnIndex = 0;
    room.wordsPlayed = [];
    room.votes = {};
    room.winner = null;

    // --------------------------
    // Generar palabras y roles
    // --------------------------
    const words = await generateWords(room.category);
    assignRoles(room, words);

    // --------------------------
    // ORDEN DE TURNOS ALEATORIO
    // (Impostor nunca inicia ni es segundo)
    // --------------------------
    const alivePlayers = room.players.filter(p => p.alive);
    const impostor = alivePlayers.find(p => p.id === room.impostorId);
    const others = alivePlayers.filter(p => p.id !== room.impostorId);

    // Shuffle jugadores normales
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }

    // Insertar impostor en posición >= 2
    const minIndex = Math.min(2, others.length);
    const maxIndex = others.length;
    const impostorIndex =
      Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;

    others.splice(impostorIndex, 0, impostor);

    room.turnOrder = others.map(p => p.id);
    room.turnIndex = 0;

    // --------------------------
    // Enviar rol PRIVADO
    // --------------------------
    room.players.forEach(player => {
      io.to(player.id).emit("roleAssigned", {
        role: player.role,
        word: player.word
      });
    });

    io.to(roomId).emit("roomUpdate", room);
  });

  // ==========================
  // CONFIRMAR ROL
  // ==========================
  socket.on("confirmRole", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.phase !== "role") return;

    room.roleConfirmed[socket.id] = true;

    const allConfirmed = room.players.every(
      p => room.roleConfirmed[p.id]
    );

    if (allConfirmed) {
      room.phase = "round";
      room.turnIndex = 0;
      io.to(roomId).emit("roomUpdate", room);
    }
  });

  // ==========================
  // ENVIAR PALABRA (TURNOS REALES)
  // ==========================
  socket.on("submitWord", ({ roomId, word }) => {
    const room = getRoom(roomId);
    if (!room || room.phase !== "round") return;

    const currentPlayerId = room.turnOrder[room.turnIndex];
    const currentPlayer = room.players.find(
      p => p.id === currentPlayerId && p.alive
    );

    // Validar turno
    if (!currentPlayer || currentPlayer.id !== socket.id) return;

    const usedWords = room.wordsPlayed.map(w => w.word.toLowerCase());
    if (!isValidWord(word, usedWords)) return;

    room.wordsPlayed.push({
      playerId: socket.id,
      word,
      round: room.round
    });

    // Avanzar turno
    room.turnIndex++;

    // ¿Todos jugaron?
    if (room.turnIndex >= room.turnOrder.length) {
      room.phase = "voting";
      room.turnIndex = 0;
    }

    io.to(roomId).emit("roomUpdate", room);
  });

  // ==========================
  // VOTACIÓN + FEEDBACK + GANADOR
  // ==========================
  socket.on("submitVote", ({ roomId, targetId }) => {
    const room = getRoom(roomId);
    if (!room || room.phase !== "voting") return;

    // Guardar voto
    room.votes[socket.id] = targetId;

    // Feedback SOLO al que vota
    io.to(socket.id).emit("voteRegistered", { targetId });

    // Estado global de votos
    io.to(roomId).emit("voteUpdate", {
      votes: room.votes
    });


    const alivePlayers = room.players.filter(p => p.alive);

    if (Object.keys(room.votes).length === alivePlayers.length) {
      const eliminated = countVotes(room.votes);

      if (eliminated) {
        const player = room.players.find(p => p.id === eliminated);
        if (player) player.alive = false;
      }

      // Reset de ronda
      room.votes = {};
      room.wordsPlayed = [];
      room.round++;

      // ==========================
      // CONDICIONES DE VICTORIA
      // ==========================
      let winner = null;
      const aliveAfterVote = room.players.filter(p => p.alive);

      // Jugadores ganan
      if (eliminated && eliminated === room.impostorId) {
        winner = "players";
      }

      // Impostor gana por 1v1
      if (!winner) {
        const impostorAlive = aliveAfterVote.some(
          p => p.id === room.impostorId
        );
        if (impostorAlive && aliveAfterVote.length <= 2) {
          winner = "impostor";
        }
      }

      // Impostor gana por rondas
      if (!winner && room.round > room.maxRounds) {
        winner = "impostor";
      }

      if (winner) {
        room.phase = "ended";
        room.winner = winner;
      } else {
        room.phase = "round";
        room.turnIndex = 0;
      }

      io.to(roomId).emit("roomUpdate", room);
    }
  });
}
