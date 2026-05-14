import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GameRoom from './pages/GameRoom';
import { Toaster } from 'react-hot-toast';
import useGameStore from './store/gameStore';

function App() {
  const connect = useGameStore(state => state.connect);

  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <Router>
      <div className="min-h-screen bg-[#0f172a] text-slate-200">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:id" element={<GameRoom />} />
        </Routes>
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;
