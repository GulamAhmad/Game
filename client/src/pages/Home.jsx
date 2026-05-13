import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { User, Users, PlusCircle, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import useGameStore from '../store/gameStore';
import toast from 'react-hot-toast';

const Home = () => {
  const [name, setName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const navigate = useNavigate();
  const { createRoom, joinRoom, error, roomId } = useGameStore();

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleCreateRoom = () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    createRoom(name);
  };

  const handleJoinRoom = () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!roomIdInput.trim()) {
      toast.error('Please enter a room code');
      return;
    }
    joinRoom(roomIdInput.toUpperCase(), name);
  };

  useEffect(() => {
    if (roomId) {
      navigate(`/room/${roomId}`);
    }
  }, [roomId, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[#020617]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Hero Text */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-left space-y-6 hidden lg:block"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            AI-Powered Deception Game
          </div>
          <h1 className="text-7xl font-black leading-tight">
            Who is the <br />
            <span className="text-gradient">Imposter?</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-md leading-relaxed">
            A thrilling multiplayer game where one player gets a different question. Use your logic to reveal the liar before they win.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center text-xs font-bold">
                  P{i}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 font-medium">Join 10k+ players worldwide</p>
          </div>
        </motion.div>

        {/* Right Side: Interactive Card */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md mx-auto"
        >
          <div className="glass-card p-8 md:p-10 rounded-[2.5rem] relative z-10">
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-4xl font-black mb-2 text-gradient">The Imposter</h1>
              <p className="text-slate-400">Find the liar among you</p>
            </div>

            <div className="space-y-8">
              {/* Name Input */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" />
                  Survivor Name
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Ghost Hunter"
                    className="w-full glass-input rounded-2xl py-4 px-6 text-lg focus:outline-none placeholder:text-slate-700"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleCreateRoom}
                  className="btn-premium group w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(139,92,246,0.5)] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  <PlusCircle className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                  Create New Room
                </button>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Secret Entrance</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                      placeholder="ENTER ROOM CODE"
                      className="w-full glass-input rounded-2xl py-4 px-6 text-center font-mono text-xl tracking-[0.3em] focus:outline-none placeholder:text-slate-700 placeholder:tracking-normal placeholder:text-sm"
                    />
                  </div>
                  <button
                    onClick={handleJoinRoom}
                    className="group w-full bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold py-5 rounded-2xl border border-slate-800 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  >
                    Join Existing Room
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements for the card */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full -z-10" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-rose-500/10 blur-2xl rounded-full -z-10" />
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
        <ShieldAlert className="w-5 h-5 text-rose-500" />
        <span className="font-bold tracking-tighter text-lg uppercase italic">NoMercy Games</span>
      </div>
    </div>
  );
};

export default Home;
