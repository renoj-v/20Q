import { useState } from 'react';
import ModeSelection from './components/ModeSelection';
import AIGuesserMode from './components/AIGuesserMode';
import UserGuesserMode from './components/UserGuesserMode';
import './App.css';

function App() {
  const [gameMode, setGameMode] = useState(null);

  const handleSelectMode = (mode) => {
    setGameMode(mode);
  };

  const handleBackToMenu = () => {
    setGameMode(null);
  };

  return (
    <div className="app">
      {!gameMode && <ModeSelection onSelectMode={handleSelectMode} />}
      {gameMode === 'ai-guesser' && <AIGuesserMode onBackToMenu={handleBackToMenu} />}
      {gameMode === 'user-guesser' && <UserGuesserMode onBackToMenu={handleBackToMenu} />}
    </div>
  );
}

export default App;
