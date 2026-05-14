import { create } from 'zustand';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'https://game-3ot9.onrender.com');

const useGameStore = create((set, get) => ({
  socket,
  roomId: null,
  playerName: '',
  players: [],
  status: 'lobby', // lobby, generating, answering, discussion, voting, results
  currentQuestion: '',
  imposterId: null,
  answers: [],
  results: null,
  currentRound: 0,
  totalRounds: 1,
  error: null,

  setPlayerName: (name) => set({ playerName: name }),
  
  createRoom: (name) => {
    set({ playerName: name });
    socket.emit('create-room', { playerName: name });
  },

  joinRoom: (roomId, name) => {
    set({ playerName: name });
    socket.emit('join-room', { roomId, playerName: name });
  },

  startGame: (category, rounds) => {
    const { roomId } = get();
    socket.emit('start-game', { roomId, category, rounds });
  },

  nextRound: (category) => {
    const { roomId } = get();
    socket.emit('next-round', { roomId, category });
  },

  submitAnswer: (answer) => {
    const { roomId } = get();
    socket.emit('submit-answer', { roomId, answer });
  },

  startVoting: () => {
    const { roomId } = get();
    socket.emit('start-voting', { roomId });
  },

  submitVote: (votedPlayerId) => {
    const { roomId } = get();
    socket.emit('submit-vote', { roomId, votedPlayerId });
  },

  playAgain: () => {
    const { roomId } = get();
    socket.emit('play-again', { roomId });
  },

  reset: () => set({
    roomId: null,
    players: [],
    status: 'lobby',
    currentQuestion: '',
    imposterId: null,
    answers: [],
    results: null,
    error: null
  })
}));

// Setup socket listeners
socket.on('room-created', ({ roomId, players }) => {
  useGameStore.setState({ roomId, players, status: 'lobby' });
});

socket.on('joined-room', ({ roomId, players }) => {
  useGameStore.setState({ roomId, players, status: 'lobby' });
});

socket.on('player-joined', ({ players }) => {
  useGameStore.setState({ players });
});

socket.on('player-left', ({ players }) => {
  useGameStore.setState({ players });
});

socket.on('game-status', ({ status, players }) => {
  const updates = { status };
  if (players) updates.players = players;
  useGameStore.setState(updates);
});

socket.on('game-started', ({ status, imposterId }) => {
  useGameStore.setState({ status, imposterId, results: null, answers: [] });
});

socket.on('receive-question', ({ question }) => {
  useGameStore.setState({ currentQuestion: question });
});

socket.on('player-answered', ({ players }) => {
  // Sync the players list to show who has answered
  const currentPlayers = useGameStore.getState().players;
  const updatedPlayers = currentPlayers.map(p => {
    const updated = players.find(up => up.id === p.id);
    return updated ? { ...p, answer: updated.hasAnswered ? 'HIDDEN' : null } : p;
  });
  useGameStore.setState({ players: updatedPlayers });
});

socket.on('vote-recorded', ({ players }) => {
  const currentPlayers = useGameStore.getState().players;
  const updatedPlayers = currentPlayers.map(p => {
    const updated = players.find(up => up.id === p.id);
    return updated ? { ...p, hasVoted: updated.hasVoted } : p;
  });
  useGameStore.setState({ players: updatedPlayers });
});

socket.on('all-answered', ({ status, players }) => {
  useGameStore.setState({ status, answers: players });
});

socket.on('results', (results) => {
  // results here contains { votedOut, imposter, questions, players, currentRound, totalRounds, isTie }
  useGameStore.setState({ 
    status: 'results', 
    results, 
    players: results.players, // Update scores
    currentRound: results.currentRound,
    totalRounds: results.totalRounds
  });
});

socket.on('error', ({ message }) => {
  useGameStore.setState({ error: message });
  setTimeout(() => useGameStore.setState({ error: null }), 3000);
});

export default useGameStore;
