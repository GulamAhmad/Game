const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { generateQuestions } = require("./gemini");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create-room", ({ playerName }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const player = {
      id: socket.id,
      name: playerName,
      isHost: true,
      answer: null,
      votes: 0,
      isImposter: false,
      score: 0,
    };

    rooms.set(roomId, {
      id: roomId,
      players: [player],
      status: "lobby",
      questions: null,
      imposterId: null,
      currentRound: 0,
      totalRounds: 1,
    });

    socket.join(roomId);
    socket.emit("room-created", { roomId, players: [player] });
  });

  socket.on("join-room", ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    if (!room) {
      return socket.emit("error", { message: "Room not found" });
    }
    if (room.status !== "lobby") {
      return socket.emit("error", { message: "Game already started" });
    }

    const player = {
      id: socket.id,
      name: playerName,
      isHost: false,
      answer: null,
      votes: 0,
      isImposter: false,
      score: 0,
    };

    room.players.push(player);
    socket.join(roomId);
    io.to(roomId).emit("player-joined", { players: room.players });
    socket.emit("joined-room", { roomId, players: room.players });
  });

  socket.on("start-game", async ({ roomId, category, rounds }) => {
    const room = rooms.get(roomId);
    if (!room || room.players.length < 3) {
      return socket.emit("error", { message: "Need at least 3 players to start" });
    }

    room.totalRounds = rounds || 1;
    room.currentRound = 1;
    room.status = "generating";
    io.to(roomId).emit("game-status", { status: "generating" });

    const questions = await generateQuestions(category);
    room.questions = questions;

    // Pick a random imposter
    const imposterIndex = Math.floor(Math.random() * room.players.length);
    room.imposterId = room.players[imposterIndex].id;
    room.players.forEach((p) => {
      p.isImposter = p.id === room.imposterId;
      p.answer = null;
      p.votes = 0;
    });

    room.status = "answering";
    io.to(roomId).emit("game-started", {
      status: "answering",
      imposterId: room.imposterId, // Client will hide this from others
    });

    // Send questions to players
    room.players.forEach((p) => {
      const q = p.isImposter ? questions.imposter : questions.normal;
      io.to(p.id).emit("receive-question", { question: q });
    });
  });

  socket.on("submit-answer", ({ roomId, answer }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.answer = answer;
    }

    const allAnswered = room.players.every((p) => p.answer !== null);
    if (allAnswered) {
      room.status = "discussion";
      io.to(roomId).emit("all-answered", {
        status: "discussion",
        players: room.players.map(p => ({ id: p.id, name: p.name, answer: p.answer })),
      });
    } else {
      io.to(roomId).emit("player-answered", {
        players: room.players.map(p => ({ id: p.id, name: p.name, hasAnswered: p.answer !== null })),
      });
    }
  });

  socket.on("start-voting", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.status = "voting";
    io.to(roomId).emit("game-status", { status: "voting" });
  });

  socket.on("submit-vote", ({ roomId, votedPlayerId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const votedPlayer = room.players.find((p) => p.id === votedPlayerId);
    if (votedPlayer) {
      votedPlayer.votes += 1;
    }

    // Keep track of who voted
    const votingPlayer = room.players.find((p) => p.id === socket.id);
    votingPlayer.hasVoted = true;

    const allVoted = room.players.every((p) => p.hasVoted);
    if (allVoted) {
      // ... same logic ...
      let maxVotes = -1;
      let votedOut = null;
      let isTie = false;

      room.players.forEach((p) => {
        if (p.votes > maxVotes) {
          maxVotes = p.votes;
          votedOut = p;
          isTie = false;
        } else if (p.votes === maxVotes) {
          isTie = true;
        }
      });

      room.status = "results";
      
      // Update Scores
      const isImposterCaught = !isTie && votedOut.isImposter;
      if (isImposterCaught) {
        // Crew wins points
        room.players.forEach(p => {
          if (!p.isImposter) p.score += 1;
        });
      } else {
        // Imposter wins points
        const imposter = room.players.find(p => p.isImposter);
        if (imposter) imposter.score += 3;
      }

      io.to(roomId).emit("results", {
        votedOut: isTie ? null : { id: votedOut.id, name: votedOut.name, isImposter: votedOut.isImposter },
        imposter: room.players.find((p) => p.isImposter),
        questions: room.questions,
        players: room.players, // Send updated scores
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
        isTie,
      });
    } else {
      io.to(roomId).emit("vote-recorded", {
        players: room.players.map(p => ({ id: p.id, name: p.name, hasVoted: p.hasVoted })),
      });
    }
  });

  socket.on("next-round", async ({ roomId, category }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.currentRound += 1;
    room.status = "generating";
    io.to(roomId).emit("game-status", { status: "generating" });

    const questions = await generateQuestions(category);
    room.questions = questions;

    // Pick a NEW random imposter
    const imposterIndex = Math.floor(Math.random() * room.players.length);
    room.imposterId = room.players[imposterIndex].id;
    room.players.forEach((p) => {
      p.isImposter = p.id === room.imposterId;
      p.answer = null;
      p.votes = 0;
      p.hasVoted = false;
    });

    room.status = "answering";
    io.to(roomId).emit("game-started", {
      status: "answering",
      imposterId: room.imposterId,
    });

    room.players.forEach((p) => {
      const q = p.isImposter ? questions.imposter : questions.normal;
      io.to(p.id).emit("receive-question", { question: q });
    });
  });

  socket.on("play-again", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.status = "lobby";
    room.currentRound = 0;
    room.players.forEach(p => {
      p.answer = null;
      p.votes = 0;
      p.hasVoted = false;
      p.score = 0; // Reset scores for a completely new session
    });
    io.to(roomId).emit("game-status", { status: "lobby", players: room.players });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Cleanup rooms
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          // If host left, assign new host
          if (!room.players.some((p) => p.isHost)) {
            room.players[0].isHost = true;
          }
          io.to(roomId).emit("player-left", { players: room.players });
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
