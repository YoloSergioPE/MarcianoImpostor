// ==============================
// SOCKET + APP
// ==============================
const socket = io(window.location.origin);
const app = document.getElementById("app");

// ==============================
// CONSTANTES
// ==============================
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

const avatars = [
  "alien_1.png",
  "alien_2.png",
  "alien_3.png",
  "alien_4.png",
  "alien_5.png",
  "alien_6.png",
  "alien_7.png",
  "alien_8.png"
];

// ==============================
// ESTADO DEL JUEGO (SOCKET)
// ==============================
let state = {
  roomId: null,
  role: null,
  word: null,
  room: null,
  roleConfirmed: false,
  hasVoted: false,
  voteCounts: {},
  votedPlayers: []
};

// ==============================
// ESTADO DE UI
// ==============================
let uiState = {
  nickname: "",
  avatar: "alien_1.png",
  selectedGame: null,
  screen: "welcome" // welcome | games | mode | lobby | game
};

// ==============================
// WELCOME
// ==============================
function renderWelcome() {
  app.innerHTML = `
    <div class="welcome-card">
      <img src="assets/avatars/${uiState.avatar}" class="avatar-large" />

      <h2>Marci Juegos</h2>
      <p>Personaliza tu identidad</p>

      <input
        placeholder="Tu nickname"
        value="${uiState.nickname}"
        oninput="setNickname(this.value)"
      />

      <div class="avatar-grid">
        ${avatars.map(a => `
          <img
            src="assets/avatars/${a}"
            class="avatar-option ${uiState.avatar === a ? "selected" : ""}"
            onclick="selectAvatar('${a}')"
          />
        `).join("")}
      </div>

      <button onclick="goToGames()">Jugar</button>
    </div>
  `;
}

function setNickname(value) {
  uiState.nickname = value;
}

function selectAvatar(avatar) {
  uiState.avatar = avatar;
  renderWelcome();
}

function goToGames() {
  if (!uiState.nickname.trim()) {
    alert("Ingresa tu nickname");
    return;
  }
  uiState.screen = "games";
  renderGames();
}

// ==============================
// GAMES
// ==============================
function renderGames() {
  app.innerHTML = `
    <div class="games-card">
      <h2>Elige un juego</h2>

      <button class="game-btn active" onclick="selectGame('impostor')">
        👽 Marciano Impostor
      </button>

      <button class="game-btn disabled">
        🔒 Próximamente
      </button>
    </div>
  `;
}

function selectGame(game) {
  uiState.selectedGame = game;
  uiState.screen = "mode";
  renderMode();
}

// ==============================
// MODE
// ==============================
function renderMode() {
  app.innerHTML = `
    <div class="mode-card">
      <h2>¿Cómo quieres jugar?</h2>

      <button onclick="renderCreateRoomScreen()">Crear sala</button>
      <button onclick="renderJoinRoomScreen()">Unirse a sala</button>

    </div>
  `;
}

function renderCreateRoomScreen() {
  uiState.screen = "create";

  app.innerHTML = `
    <div class="game-card">
      <h2>Crear sala</h2>

      <p><strong>Jugador:</strong> ${uiState.nickname}</p>

      <select id="category">
        ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("")}
      </select>

      <button onclick="createRoom()">Crear sala</button>

      <button class="secondary" onclick="renderMode()">⬅ Volver</button>
    </div>
  `;
}

function renderJoinRoomScreen() {
  uiState.screen = "join";

  app.innerHTML = `
    <div class="game-card">
      <h2>Unirse a sala</h2>

      <p><strong>Jugador:</strong> ${uiState.nickname}</p>

      <input id="roomCode" placeholder="Código de sala" />

      <button onclick="joinRoom()">Unirse</button>

      <button class="secondary" onclick="renderMode()">⬅ Volver</button>
    </div>
  `;
}

// ==============================
// CREATE / JOIN
// ==============================
window.createRoom = () => {
  const category = document.getElementById("category").value;

  socket.emit("createRoom", {
    name: uiState.nickname,
    avatar: uiState.avatar,
    category
  });
};

window.joinRoom = () => {
  const roomId = document.getElementById("roomCode").value;

  if (!roomId.trim()) {
    alert("Ingresa el código de la sala");
    return;
  }

  socket.emit("joinRoom", {
    roomId,
    name: uiState.nickname,
    avatar: uiState.avatar
  });
};


// ==============================
// ROOM UPDATE
// ==============================
socket.on("roomUpdate", room => {
  state.room = room;
  state.roomId = room.id;

  if (room.phase === "lobby") {
    renderLobby(room);
    return;
  }

  if (room.phase === "round") {
    state.hasVoted = false;
    state.voteCounts = {};
    state.votedPlayers = [];
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

// ==============================
// LOBBY
// ==============================
function renderLobby(room) {
  app.innerHTML = `
    <div class="game-card">
      <h3>Sala ${room.id}</h3>

      <div class="players-bar">
        ${room.players.map(p => `
          <div class="player-slot ${p.id === socket.id ? "me" : ""}">
            <img src="assets/avatars/${p.avatar}" class="avatar-small" />
            <div class="player-name">${p.name}</div>
          </div>
        `).join("")}
      </div>

      ${socket.id === room.hostId
        ? `
          <p><strong>Categoría:</strong> ${room.category}</p>
          <button onclick="startGame()">Iniciar partida</button>
        `
        : `<p class="waiting">⏳ Esperando que el host inicie la partida...</p>`
      }
    </div>
  `;
}



window.startGame = () => {
  socket.emit("startGame", { roomId: state.roomId });
};

// ==============================
// ROLE
// ==============================
socket.on("roleAssigned", ({ role, word }) => {
  state.role = role;
  state.word = word;
  state.roleConfirmed = false;

  app.innerHTML = `
    <div class="game-card">
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
    <div class="game-card">
      <h2>Rol confirmado</h2>
      <p>⏳ Esperando a los demás jugadores...</p>
    </div>
  `;
};

// ==============================
// ROUND
// ==============================
function renderRound(room) {
  const alivePlayers = room.turnOrder
    .map(id => room.players.find(p => p.id === id && p.alive))
    .filter(Boolean);

  const currentPlayerId = room.turnOrder[room.turnIndex];
  const currentTurnPlayer = room.players.find(
    p => p.id === currentPlayerId && p.alive
  );


  app.innerHTML = `
    <div class="game-card ingame">
      <h3>Ronda ${room.round}</h3>

      <div class="players-bar">
        ${alivePlayers.map(p => `
          <div class="player-slot 
          ${p.id === socket.id ? "me" : ""} 
          ${p.id === currentPlayerId ? "active-turn" : ""}">
            <img src="assets/avatars/${p.avatar}" class="avatar-small" />
            <div class="player-name">${p.name}</div>
          </div>
        `).join("")}
      </div>

      <ul class="words-list">
        ${room.wordsPlayed.map(w => {
          const player = room.players.find(p => p.id === w.playerId);
          return `<li><strong>${player.name}:</strong> ${w.word}</li>`;
        }).join("")}
      </ul>

      ${currentTurnPlayer && currentTurnPlayer.id === socket.id
        ? `<input id="word" placeholder="Tu palabra" />
          <button onclick="sendWord()">Enviar palabra</button>`
        : `<p class="waiting">
            ⏳ Turno de ${currentTurnPlayer?.name || "otro jugador"}
          </p>`
      }
    </div>
  `;
}

window.sendWord = () => {
  const input = document.getElementById("word");
  if (!input.value.trim()) return;

  socket.emit("submitWord", {
    roomId: state.roomId,
    word: input.value.trim()
  });
};

// ==============================
// VOTING
// ==============================
socket.on("voteUpdate", ({ votes }) => {
  state.voteCounts = {};
  state.votedPlayers = Object.keys(votes);

  Object.values(votes).forEach(id => {
    state.voteCounts[id] = (state.voteCounts[id] || 0) + 1;
  });

  renderVoting(state.room);
});

socket.on("voteRegistered", () => {
  state.hasVoted = true;
  renderVoting(state.room);
});

function renderVoting(room) {
  app.innerHTML = `
    <div class="game-card">
      <h3>Votación</h3>

      <div class="vote-grid">
        ${room.players
          .filter(p => p.alive)
          .map(p => `
            <div class="vote-card ${state.hasVoted ? "disabled" : ""}">
              <img src="assets/avatars/${p.avatar}" />
              <h4>${p.name}</h4>

              ${state.voteCounts[p.id]
                ? `<div class="votes">🗳 ${state.voteCounts[p.id]}</div>`
                : ""
              }

              <button
                onclick="vote('${p.id}')"
                ${state.hasVoted ? "disabled" : ""}
              >
                Votar
              </button>
            </div>
          `).join("")}
      </div>

      ${state.hasVoted ? `<p class="waiting">✔ Voto enviado</p>` : ""}
    </div>
  `;
}


window.vote = (id) => {
  socket.emit("submitVote", { roomId: state.roomId, targetId: id });
};

// ==============================
// END
// ==============================
function renderEnd(room) {
  app.innerHTML = `
    <div class="game-card">
      <h2>${room.winner === "players" ? "🎉 Ganaron los jugadores" : "🕵️ Ganó el impostor"}</h2>
      <button onclick="location.reload()">Jugar otra vez</button>
    </div>
  `;
}

// ==============================
// START
// ==============================
renderWelcome();
