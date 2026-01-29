const overlay = document.getElementById("overlay");
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

// overlay se conecta como spectator
const socket = io("http://192.168.1.42:3001", {
  query: {
    role: "spectator",
    roomId
  }
});

let roomState = null;

socket.on("roomUpdate", room => {
  roomState = room;
  render(room);
});

socket.on("voteUpdate", ({ votes }) => {
  if (!roomState) return;
  roomState.votes = votes;
  render(roomState);
});


function renderRound(room) {
  overlay.innerHTML = `
    <div class="overlay-card">
      <h2>Ronda ${room.round}</h2>

      <div class="players">
        ${room.players
          .filter(p => p.alive)
          .map(p => `
            <div class="player ${p.id === room.turnOrder[room.turnIndex] ? "active" : ""}">
              <img src="/assets/avatars/${p.avatar}">
              <div class="player-name">${p.name}</div>
            </div>
          `).join("")}
      </div>

      <div class="words">
        ${room.wordsPlayed.map(w => `
          <div class="word">
            <strong>${room.players.find(p => p.id === w.playerId).name}:</strong>
            ${w.word}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderVoting(room) {
  overlay.innerHTML = `
    <div class="overlay-card">
      <h2>Votación</h2>

      <div class="vote-grid">
        ${room.players
          .filter(p => p.alive)
          .map(p => `
            <div class="vote-card">
              <img src="/assets/avatars/${p.avatar}">
              <div class="player-name">${p.name}</div>
              <div class="votes">${room.votes?.[p.id] || 0}</div>
            </div>
          `).join("")}
      </div>
    </div>
  `;
}
function renderEnd(room) {
  const impostor = room.players.find(p => p.id === room.impostorId);

  overlay.innerHTML = `
    <div class="overlay-card end">
      <h1>${room.winner === "players"
        ? "GANAN LOS JUGADORES"
        : "GANA EL IMPOSTOR"}</h1>

      <div class="reveal">
        <img src="/assets/avatars/${impostor.avatar}">
        <p>IMPOSTOR: ${impostor.name}</p>
      </div>
    </div>
  `;
}
function renderLobby(room) {
  overlay.innerHTML = `
    <div class="overlay-card">
      <h2>Sala ${room.id}</h2>

      <div class="players">
        ${room.players.map(p => `
          <div class="player">
            <img src="/assets/avatars/${p.avatar}">
            <div class="player-name">${p.name}</div>
          </div>
        `).join("")}
      </div>

      <p>⏳ Esperando inicio de partida...</p>
    </div>
  `;
}

function renderRole(room) {
  overlay.innerHTML = `
    <div class="overlay-card">
      <h2>Asignando roles...</h2>

      <div class="players">
        ${room.players.map(p => `
          <div class="player">
            <img src="/assets/avatars/${p.avatar}">
            <div class="player-name">${p.name}</div>
          </div>
        `).join("")}
      </div>

      <p>⏳ Los jugadores están confirmando su rol</p>
    </div>
  `;
}


function render(room) {
  switch (room.phase) {
    case "lobby":
      renderLobby(room);
      break;
    case "role":
      renderRole(room); // 👈 ESTE FALTABA
      break;
    case "round":
      renderRound(room);
      break;
    case "voting":
      renderVoting(room);
      break;
    case "ended":
      renderEnd(room);
      break;
  }
}
