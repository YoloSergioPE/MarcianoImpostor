const socket = io("http://localhost:3001");
const app = document.getElementById("app");

const CATEGORIES = [
  "Cantantes",
  "Famosos",
  "Películas",
  "Personajes Públicos",
  "Juegos",
  "Personajes de Videojuegos",
  "Series",
  "Animales",
  "Lugares Famosos",
  "Comida"
];

let state = {
  roomId: null,
  playerId: null,
  role: null,
  word: null,
  room: null,
  roleConfirmed: false,

  // Votación
  hasVoted: false,
  votedFor: null,
  voteCounts: {},
  votedPlayers: []
};


// ----------- HOME -----------
function renderHome() {
app.innerHTML = `
    <div class="card">
      <h2>El Impostor de la Palabra</h2>

      <input id="name" placeholder="Tu nombre" />

      <select id="category">
        ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("")}
      </select>

      <button onclick="createRoom()">Crear sala</button>

      <hr />

      <input id="roomCode" placeholder="Código de sala" />
      <button onclick="joinRoom()">Unirse</button>
    </div>
  `;
}
renderHome();

// ----------- CREATE / JOIN -----------
window.createRoom = () => {
  const name = document.getElementById("name").value;
  const category = document.getElementById("category").value;

  socket.emit("createRoom", {
    name,
    category
  });
};



window.joinRoom = () => {
const name = document.getElementById("name").value;
const roomId = document.getElementById("roomCode").value;
socket.emit("joinRoom", { roomId, name });
};


// ----------- ROOM UPDATE -----------
socket.on("roomUpdate", room => {
  state.room = room;
  state.roomId = room.id;

  if (room.phase === "lobby") {
    renderLobby(room);
    return;
  }

  if (room.phase === "role") {
    // No renderizamos nada aquí
    // El rol ya se muestra con roleAssigned
    return;
  }

  if (room.phase === "round") {
    state.voteCounts = {};
    state.votedPlayers = [];
    state.hasVoted = false;
    state.votedFor = null;
    if (!state.roleConfirmed) return;
    renderRound(room);
    return;
  }

  if (room.phase === "voting") {
    renderVoting(room);
    return;
  }

  if (room.phase === "ended") {
    renderEnd(room);
  }
});



// ----------- LOBBY -----------
function renderLobby(room) {
  app.innerHTML = `
    <div class="card">
      <h3>Sala ${room.id}</h3>

      <p><strong>Jugadores:</strong></p>
      <ul>
        ${room.players.map(p => `<li>${p.name}</li>`).join("")}
      </ul>

      ${socket.id === room.hostId
        ? `
          <p><strong>Categoría:</strong> ${room.category}</p>
          <button onclick="startGame()">Iniciar partida</button>
        `
        : `<p>⏳ Esperando que el host inicie la partida...</p>`
      }
    </div>
  `;
}



window.startGame = () => {
socket.emit("startGame", { roomId: state.roomId });
};


// ----------- ROLE -----------
socket.on("roleAssigned", ({ role, word }) => {
  state.role = role;
  state.word = word;
  state.roleConfirmed = false;

  app.innerHTML = `
    <div class="card">
      <h2>Tu rol: ${role.toUpperCase()}</h2>
      <h3>Tu palabra:</h3>
      <p><strong>${word}</strong></p>
      <button onclick="confirmRole()">Entendido</button>
    </div>
  `;
});

window.confirmRole = () => {
  state.roleConfirmed = true;
  socket.emit("confirmRole", { roomId: state.roomId });

  app.innerHTML = `
    <div class="card">
      <h2>Rol confirmado</h2>
      <p>⏳ Esperando a los demás jugadores...</p>
    </div>
  `;
};





// ----------- ROUND -----------
function renderRound(room) {
  const alivePlayers = room.turnOrder
  .map(id => room.players.find(p => p.id === id && p.alive))
  .filter(Boolean);

  const currentPlayerId = room.turnOrder[room.turnIndex];
  const currentTurnPlayer = room.players.find(
    p => p.id === currentPlayerId && p.alive
  );

  const currentName = currentTurnPlayer?.name ?? "";


  // Barra horizontal de jugadores
  const playersBar = alivePlayers.map(p => {
    const isTurn = currentTurnPlayer && p.id === currentTurnPlayer.id;
    return `
      <div class="player-slot 
      ${isTurn ? "active-turn" : ""} 
      ${p.id === socket.id ? "me" : ""}">
        <div class="avatar">🧑</div>
        <div class="player-name">
          ${p.name}${p.id === socket.id ? " (Tú)" : ""}
        </div>
      </div>
    `;
  }).join("");

  // Palabras jugadas
  const wordsHtml = room.wordsPlayed.map(w => {
    const player = room.players.find(p => p.id === w.playerId);
    return `
      <li>
        <strong>${player ? player.name : "?"}:</strong> ${w.word}
      </li>
    `;
  }).join("");

  app.innerHTML = `
    <div class="card">
      <h3>Ronda ${room.round}</h3>

      <div class="players-bar">
        ${playersBar}
      </div>

      <ul class="words-list">
        ${wordsHtml}
      </ul>

      ${
        currentTurnPlayer && socket.id === currentTurnPlayer.id
          ? `
            <input id="word" placeholder="Tu palabra" />
            <button onclick="sendWord()">Enviar palabra</button>
          `
          : `<p class="waiting">⏳ Turno de <strong>${currentName}</strong></p>`

      }
    </div>
  `;
}

socket.on("voteUpdate", ({ votes }) => {
  state.voteCounts = {};
  state.votedPlayers = Object.keys(votes);

  Object.values(votes).forEach(targetId => {
    state.voteCounts[targetId] = (state.voteCounts[targetId] || 0) + 1;
  });

  if (state.room && state.room.phase === "voting") {
    renderVoting(state.room);
  }
});


socket.on("voteRegistered", ({ targetId }) => {
  state.hasVoted = true;
  state.votedFor = targetId;

  if (state.room) {
    renderVoting(state.room);
  }
});


window.sendWord = () => {
  const input = document.getElementById("word");
  if (!input || !input.value.trim()) return;

  socket.emit("submitWord", {
    roomId: state.roomId,
    word: input.value.trim()
  });
};


// ----------- VOTING -----------
function renderVoting(room) {
  const alivePlayers = room.players.filter(p => p.alive);

  app.innerHTML = `
    <div class="card">
      <h3>Votación</h3>

      <ul class="words-list">
        ${alivePlayers.map(p => {
          const votes = state.voteCounts[p.id] || 0;
          const hasVoted = state.votedPlayers.includes(p.id);

          return `
            <li>
              <strong>${p.name}</strong>
              ${votes > 0 ? ` — 🗳️ ${votes}` : ""}
            </li>
          `;
        }).join("")}
      </ul>

      <hr />

      ${alivePlayers.map(p => `
        <button
          onclick="vote('${p.id}')"
          ${state.hasVoted ? "disabled" : ""}
        >
          ${p.name}
        </button>
      `).join("")}

      ${
        state.hasVoted
          ? `<p class="waiting">✔ Voto enviado</p>`
          : `<p class="waiting">Elige a quién votar</p>`
      }
    </div>
  `;
}



window.vote = (targetId) => {
socket.emit("submitVote", { roomId: state.roomId, targetId });
};


// ----------- END -----------
function renderEnd(room) {
  const message =
    room.winner === "players"
      ? "🎉 ¡Ganaron los jugadores!"
      : "🕵️ ¡Ganó el impostor!";

  app.innerHTML = `
    <div class="card">
      <h2>${message}</h2>
      <button onclick="location.reload()">Jugar otra vez</button>
    </div>
  `;
}
