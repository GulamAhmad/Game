import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, CheckCircle2, ShieldAlert, Award, RefreshCcw, Home as HomeIcon, Copy, User, Sparkles } from 'lucide-react';
import useGameStore from '../store/gameStore';
import toast from 'react-hot-toast';

// Common Layout Wrapper
const PageWrapper = ({ children }) => (
  <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
    {/* Background Blobs */}
    <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600/10 blur-[120px] rounded-full" />
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-rose-600/10 blur-[120px] rounded-full" />
    </div>
    {children}
  </div>
);

const GameRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    socket, roomId, players, status, currentQuestion, imposterId,
    playerName, answers, results, startGame, submitAnswer,
    startVoting, submitVote, playAgain, reset
  } = useGameStore();

  const [answerInput, setAnswerInput] = useState('');
  const [selectedVote, setSelectedVote] = useState(null);
  const [localHasVoted, setLocalHasVoted] = useState(false);
  const [localHasAnswered, setLocalHasAnswered] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Random');
  const [customCategory, setCustomCategory] = useState('');
  const [numRounds, setNumRounds] = useState(1);

  const categories = ['Random', 'Food', 'Travel', 'Hobbies', 'Movies', 'Technology', 'Daily Routines', 'Animals', 'Custom'];
  const roundOptions = [1, 3, 5, 7];

  useEffect(() => {
    if (!playerName) {
      navigate('/');
    }
  }, [playerName, navigate]);

  // Reset local states when game status changes
  useEffect(() => {
    if (status === 'lobby' || status === 'generating' || status === 'answering') {
      setLocalHasVoted(false);
      setLocalHasAnswered(false);
      setAnswerInput('');
      setSelectedVote(null);
    }
  }, [status]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(id);
    toast.success('Room code copied!');
  };

  const handleStartGame = () => {
    if (players.length < 3) {
      toast.error('At least 3 players are required');
      return;
    }
    const category = selectedCategory === 'Custom' ? customCategory : selectedCategory;
    startGame(category === 'Random' ? null : category, numRounds);
  };

  const handleSubmitAnswer = () => {
    if (!answerInput.trim()) return;
    setLocalHasAnswered(true);
    submitAnswer(answerInput);
  };

  const handleSubmitVote = () => {
    if (!selectedVote) return;
    setLocalHasVoted(true);
    submitVote(selectedVote);
  };

  const isHost = players.find(p => p.id === socket.id)?.isHost;
  const me = players.find(p => p.id === socket.id);

  if (status === 'lobby') {
    return (
      <PageWrapper>
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-[2rem] p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h2 className="text-4xl font-black mb-2 flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-500" />
                  Survivor Lobby
                </h2>
                <p className="text-slate-400 font-medium">Waiting for the crew to assemble...</p>
              </div>
              <div className="group cursor-pointer bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-4 hover:border-purple-500/50 transition-all" onClick={copyRoomCode}>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Room Code</span>
                  <p className="text-2xl font-mono font-bold text-purple-400 tracking-[0.2em]">{id}</p>
                </div>
                <Copy className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {players.map((player) => (
                <motion.div
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={player.id}
                  className={`relative p-6 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border transition-all ${player.id === socket.id ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20' : 'bg-slate-900/40 border-slate-800'}`}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-400 border border-slate-800 group-hover:border-purple-500/50">
                    {player.name[0].toUpperCase()}
                  </div>
                  <span className="font-bold truncate w-full text-center text-sm">{player.name} {player.id === socket.id && '(You)'}</span>
                  {player.isHost && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {isHost && (
              <div className="mb-10 w-full">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4 block text-center">Session Category</label>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCategory === cat ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {selectedCategory === 'Custom' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-sm mx-auto"
                  >
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category..."
                      className="w-full glass-input rounded-xl py-3 px-4 text-sm focus:outline-none placeholder:text-slate-700"
                    />
                  </motion.div>
                )}
              </div>
            )}

            {isHost && (
              <div className="mb-10 w-full">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4 block text-center">Number of Rounds</label>
                <div className="flex justify-center gap-4">
                  {roundOptions.map(r => (
                    <button
                      key={r}
                      onClick={() => setNumRounds(r)}
                      className={`w-12 h-12 rounded-xl font-black transition-all border ${numRounds === r ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  className="btn-premium w-full max-w-sm bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl transition-all shadow-[0_10px_40px_-10px_rgba(139,92,246,0.5)]"
                >
                  Launch Session
                </button>
              ) : (
                <div className="flex items-center gap-3 text-slate-500 font-bold uppercase text-xs tracking-[0.2em] animate-pulse">
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  Awaiting host's command
                </div>
              )}
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">{players.length} Players Connected</p>
            </div>
          </motion.div>
        </div>
      </PageWrapper>
    );
  }

  if (status === 'generating') {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full"
            />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-black text-gradient mb-2">Architecting Question...</h2>
            <p className="text-slate-500 font-medium">Gemini is weaving the web of deception</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (status === 'answering') {
    const hasAnswered = localHasAnswered || me?.answer !== null;

    return (
      <PageWrapper>
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
          >
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-4">
                <ShieldAlert className="w-3 h-3" />
                Confidential Task
              </div>
              <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-100 italic">"{currentQuestion}"</h2>
            </div>

            {!hasAnswered ? (
              <div className="space-y-6">
                <div className="relative group">
                  <textarea
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Craft your response..."
                    className="w-full glass-input rounded-2xl p-6 min-h-[160px] text-lg focus:outline-none resize-none placeholder:text-slate-700"
                  />
                </div>
                <button
                  onClick={handleSubmitAnswer}
                  className="btn-premium w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20"
                >
                  <Send className="w-6 h-6" />
                  Submit Intelligence
                </button>
              </div>
            ) : (
              <div className="text-center py-16 space-y-6">
                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2">Transmission Received</h3>
                  <p className="text-slate-500 font-medium italic">Waiting for the rest of the crew to speak...</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </PageWrapper>
    );
  }

  if (status === 'discussion') {
    return (
      <PageWrapper>
        <div className="w-full max-w-5xl flex flex-col items-center">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black text-gradient mb-4">The Tribunal</h2>
            <p className="text-slate-400 text-lg font-medium">Scrutinize every word. The liar is among these answers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
            {answers.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card rounded-[2rem] p-8 relative group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center font-black text-slate-500">
                    {player.name[0].toUpperCase()}
                  </div>
                  <span className="font-black text-slate-300 tracking-tight">{player.name}</span>
                </div>
                <div className="relative">
                  <span className="absolute -left-4 -top-2 text-6xl text-slate-800 font-serif opacity-50">"</span>
                  <p className="text-xl md:text-2xl font-bold italic text-slate-100 leading-relaxed pl-2 relative z-10">
                    {player.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {isHost && (
            <button
              onClick={startVoting}
              className="btn-premium px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl transition-all shadow-[0_10px_40px_-10px_rgba(244,63,94,0.5)]"
            >
              Initiate Voting Protocol
            </button>
          )}
        </div>
      </PageWrapper>
    );
  }

  if (status === 'voting') {
    const hasVoted = localHasVoted || players.find(p => p.id === socket.id)?.hasVoted;

    return (
      <PageWrapper>
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="text-center mb-12 space-y-2">
            <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce-subtle" />
            <h2 className="text-5xl font-black text-rose-500 uppercase tracking-tighter">Eliminate the Imposter</h2>
            <p className="text-slate-400 font-medium">One vote. One chance to save the mission.</p>
          </div>

          {!hasVoted ? (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {players.filter(p => p.id !== socket.id).map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedVote(player.id)}
                  className={`group p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden flex flex-col justify-between ${selectedVote === player.id ? 'border-rose-500 bg-rose-500/10 ring-4 ring-rose-500/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'}`}
                >
                  <div>
                    <div className={`text-xl font-black mb-1 ${selectedVote === player.id ? 'text-rose-400' : 'text-slate-300'}`}>{player.name}</div>
                    <p className="text-xs text-slate-400 italic line-clamp-2 mb-4">
                      "{answers.find(a => a.id === player.id)?.answer || 'No answer'}"
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest group-hover:text-rose-500/50 transition-colors">Target for elimination</div>
                  {selectedVote === player.id && (
                    <div className="absolute top-4 right-4">
                      <ShieldAlert className="w-5 h-5 text-rose-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 glass-card rounded-[3rem] w-full max-w-lg">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h3 className="text-3xl font-black mb-2">Vote Locked</h3>
              <p className="text-slate-500 font-medium italic">Awaiting the final verdict from the crew...</p>
            </div>
          )}

          {!hasVoted && (
            <button
              disabled={!selectedVote}
              onClick={handleSubmitVote}
              className={`btn-premium px-16 py-6 rounded-2xl font-black text-lg transition-all ${selectedVote ? 'bg-rose-600 text-white shadow-[0_10px_40px_-10px_rgba(244,63,94,0.5)]' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
            >
              Execute Selection
            </button>
          )}
        </div>
      </PageWrapper>
    );
  }

  if (status === 'results') {
    const isImposterCaught = results?.votedOut?.isImposter;
    const isMeImposter = me?.isImposter;
    const didImposterWin = !isImposterCaught;
    const amIWinner = (isMeImposter && didImposterWin) || (!isMeImposter && isImposterCaught);
    const isGameOver = results.currentRound >= results.totalRounds;

    return (
      <PageWrapper>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl text-center pb-20"
        >
          <div className="inline-block px-6 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-black tracking-[0.3em] uppercase text-slate-500 mb-8">
            Round {results.currentRound} of {results.totalRounds}
          </div>

          <div className="mb-12">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto border-2 mb-6 shadow-2xl transition-all duration-500"
                 style={{ 
                   backgroundColor: amIWinner ? 'rgba(34, 197, 94, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                   borderColor: amIWinner ? 'rgba(34, 197, 94, 0.5)' : 'rgba(244, 63, 94, 0.5)' 
                 }}>
              {amIWinner ? (
                <Award className="w-12 h-12 text-green-500" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-rose-500" />
              )}
            </div>
            <h2 className={`text-7xl font-black tracking-tighter mb-4 ${amIWinner ? 'text-green-500' : 'text-rose-500'}`}>
              {amIWinner ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <p className="text-2xl text-slate-300 font-bold max-w-2xl mx-auto leading-relaxed">
              {isMeImposter ? (
                didImposterWin 
                  ? "Flawless deception! You've successfully tricked the crew." 
                  : "Busted! The crew saw through your lies."
              ) : (
                isImposterCaught 
                  ? `Great work! You've successfully purged ${results.votedOut.name}.`
                  : `The Imposter ${results.imposter.name} managed to slip away...`
              )}
            </p>
          </div>

          {/* Reveal & Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* The Questions */}
            <div className="glass-card rounded-[2.5rem] p-10 text-left relative overflow-hidden h-full">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">The Revelation</h3>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                    The Crew's Task
                  </span>
                  <p className="text-xl font-bold italic text-slate-200">"{results.questions.normal}"</p>
                </div>

                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                    The Imposter's Lie
                  </span>
                  <p className="text-xl font-bold italic text-rose-200">"{results.questions.imposter}"</p>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="glass-card rounded-[2.5rem] p-10 text-left h-full border-slate-800">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Leaderboard</h3>
               <div className="space-y-3">
                 {results.players.sort((a,b) => b.score - a.score).map((p, idx) => (
                   <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border ${p.id === socket.id ? 'bg-purple-600/10 border-purple-500/50' : 'bg-slate-900/50 border-slate-800'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-600 w-4">{idx + 1}</span>
                        <span className="font-bold text-slate-200">{p.name} {p.isImposter && '🕵️'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white">{p.score}</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase">pts</span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isHost && (
              !isGameOver ? (
                <button
                  onClick={() => useGameStore.getState().nextRound(selectedCategory === 'Custom' ? customCategory : selectedCategory)}
                  className="btn-premium flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 text-white font-black px-12 py-5 rounded-2xl transition-all shadow-[0_10px_40px_-10px_rgba(139,92,246,0.5)]"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Continue to Round {results.currentRound + 1}
                </button>
              ) : (
                <button
                  onClick={playAgain}
                  className="btn-premium flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-12 py-5 rounded-2xl transition-all shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)]"
                >
                  <RefreshCcw className="w-5 h-5" />
                  New Session
                </button>
              )
            )}
            <button
              onClick={() => { reset(); navigate('/'); }}
              className="group flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-black px-12 py-5 rounded-2xl border border-slate-800 transition-all"
            >
              <HomeIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Abandon Ship
            </button>
          </div>
        </motion.div>
      </PageWrapper>
    );
  }

  return null;
};

export default GameRoom;
