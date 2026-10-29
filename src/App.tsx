/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { GameEngine, GameEngineState } from './game/GameEngine';
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GodotExportModal } from './components/GodotExportModal';
import { PauseModal, GameOverModal, VictoryModal } from './components/GameModals';
import { LandscapeGuard } from './components/LandscapeGuard';
import { soundSynth } from './audio/SoundSynth';
import { micDetector } from './audio/MicNoiseDetector';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [engineState, setEngineState] = useState<GameEngineState>({
    gameState: 'menu',
    itemsCollectedCount: 0,
    totalItemsCount: 5,
    items: [],
    isExitUnlocked: false,
    guardState: 'PATROL',
    distanceToGuard: 20,
    isPlayerHidden: false,
    isPlayerCrouched: false,
    stamina: 100,
    isFlashlightOn: true,
    nearbyInteractable: null,
    micNoiseLevel: 0,
    micCategory: 'silent',
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showGodotExport, setShowGodotExport] = useState(false);
  const [isMuted, setIsMuted] = useState(soundSynth.isMuted);

  // Landscape orientation state for mobile
  const [isPortrait, setIsPortrait] = useState(false);
  const [showLandscapeGuard, setShowLandscapeGuard] = useState(true);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerWidth < window.innerHeight && window.innerWidth < 850;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleRequestFullscreenAndLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if ('orientation' in screen && 'lock' in screen.orientation) {
        await (screen.orientation as unknown as { lock: (orientation: string) => Promise<void> }).lock('landscape');
      }
    } catch {
      // Fullscreen or orientation lock may not be permitted in some iframe environments
    }
    setShowLandscapeGuard(false);
  };

  // Initialize Three.js Game Engine once on mount
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const engine = new GameEngine(canvasContainerRef.current);
    engineRef.current = engine;

    engine.setOnStateChangeListener((newState) => {
      setEngineState(newState);
    });

    // Keyboard global shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (engine.gameState === 'playing') {
          engine.pauseGame();
        } else if (engine.gameState === 'paused') {
          engine.resumeGame();
        }
      }
      if (e.code === 'KeyE') {
        engine.interact();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = async () => {
    // Attempt microphone access when starting
    await micDetector.requestMicAccess();
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handlePauseGame = () => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  };

  const handleResumeGame = () => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  };

  const handleRestartGame = () => {
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
  };

  const handleInteract = () => {
    if (engineRef.current) {
      engineRef.current.interact();
    }
  };

  const handleToggleMute = () => {
    const muted = soundSynth.toggleMute();
    setIsMuted(muted);
  };

  const handleMainMenu = () => {
    if (engineRef.current) {
      engineRef.current.gameState = 'menu';
      engineRef.current.restartGame();
      engineRef.current.gameState = 'menu';
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-white select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Atmospheric Vignette & Subtle Horror Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-radial from-transparent via-transparent to-black/75 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />

      {/* Screen: Main Menu */}
      {engineState.gameState === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenSettings={() => setShowSettings(true)}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenGodotExport={() => setShowGodotExport(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Screen: Playing HUD & Touch Controls */}
      {engineState.gameState === 'playing' && (
        <>
          <HUD
            state={engineState}
            onPause={handlePauseGame}
            onInteract={handleInteract}
          />
          <TouchControls
            player={engineRef.current?.player ?? null}
            onInteract={handleInteract}
            canInteract={!!engineState.nearbyInteractable}
          />
        </>
      )}

      {/* Screen: Paused Modal */}
      {engineState.gameState === 'paused' && (
        <PauseModal
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onOpenSettings={() => setShowSettings(true)}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Screen: Captured Game Over Modal */}
      {engineState.gameState === 'captured' && (
        <GameOverModal
          onRestart={handleRestartGame}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Screen: Escaped Victory Modal */}
      {engineState.gameState === 'escaped' && (
        <VictoryModal
          onRestart={handleRestartGame}
          onMainMenu={handleMainMenu}
          onOpenGodotExport={() => setShowGodotExport(true)}
        />
      )}

      {/* Modal: Settings */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          player={engineRef.current?.player ?? null}
        />
      )}

      {/* Modal: How to Play */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {/* Modal: Godot 4 Android Project & Exporter */}
      {showGodotExport && (
        <GodotExportModal onClose={() => setShowGodotExport(false)} />
      )}

      {/* Mobile Landscape Orientation Guard */}
      {isPortrait && showLandscapeGuard && (
        <LandscapeGuard
          onDismiss={() => setShowLandscapeGuard(false)}
          onRequestFullscreen={handleRequestFullscreenAndLandscape}
        />
      )}
    </div>
  );
}
