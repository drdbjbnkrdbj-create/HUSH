/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { PlayerController } from '../game/PlayerController';

interface TouchControlsProps {
  player: PlayerController | null;
  onInteract: () => void;
  canInteract: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  player,
  onInteract,
  canInteract,
}) => {
  // Joystick refs & state
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchId = useRef<number | null>(null);
  const joystickCenter = useRef({ x: 0, y: 0 });

  // Touch look refs
  const lookAreaRef = useRef<HTMLDivElement>(null);
  const lookTouchId = useRef<number | null>(null);
  const lastTouchPos = useRef({ x: 0, y: 0 });

  // Button states
  const [isCrouched, setIsCrouched] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(true);

  // Joystick touch handlers
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    setIsJoystickActive(true);

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchId.current === null || !player) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        const dx = touch.clientX - joystickCenter.current.x;
        const dy = touch.clientY - joystickCenter.current.y;
        const maxRadius = 45;
        const distance = Math.hypot(dx, dy);

        let clampedX = dx;
        let clampedY = dy;
        if (distance > maxRadius) {
          clampedX = (dx / distance) * maxRadius;
          clampedY = (dy / distance) * maxRadius;
        }

        setJoystickPos({ x: clampedX, y: clampedY });
        // Normalize: x is [-1, 1], y is [-1, 1]
        player.moveInput = {
          x: clampedX / maxRadius,
          y: clampedY / maxRadius,
        };
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        setIsJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        if (player) {
          player.moveInput = { x: 0, y: 0 };
        }
        break;
      }
    }
  };

  // Look area touch handlers
  const handleLookStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (lookTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchId.current = touch.identifier;
    lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (lookTouchId.current === null || !player) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const deltaX = touch.clientX - lastTouchPos.current.x;
        const deltaY = touch.clientY - lastTouchPos.current.y;
        lastTouchPos.current = { x: touch.clientX, y: touch.clientY };

        player.handleLookDelta(deltaX, deltaY);
        break;
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
        break;
      }
    }
  };

  const toggleCrouch = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!player) return;
    const next = !isCrouched;
    setIsCrouched(next);
    player.crouchHeld = next;
  };

  const toggleFlashlight = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!player) return;
    const active = player.toggleFlashlight();
    setIsFlashlightOn(active);
  };

  const handleSprintStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (player) player.sprintHeld = true;
  };

  const handleSprintEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (player) player.sprintHeld = false;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">
      {/* Right side look touch area (takes up right 60% of viewport) */}
      <div
        ref={lookAreaRef}
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
        className="absolute top-0 right-0 w-3/5 h-full pointer-events-auto"
      />

      {/* Left side Virtual Joystick Container */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
          className="relative w-32 h-32 rounded-full border-2 border-red-950/60 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center shadow-lg active:border-red-600/80 transition-colors"
        >
          {/* Inner Joystick Handle */}
          <div
            className={`w-14 h-14 rounded-full shadow-md flex items-center justify-center transition-transform ${
              isJoystickActive
                ? 'bg-red-600/80 scale-105 shadow-red-900/50'
                : 'bg-slate-700/70 border border-slate-500/40'
            }`}
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* Right side Action Buttons (Sprint, Crouch, Flashlight, Interact) */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end gap-3">
        {/* Interact Button (Large, highlighted when near item/exit) */}
        {canInteract && (
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onInteract();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onInteract();
            }}
            className="w-18 h-18 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm shadow-xl flex flex-col items-center justify-center border-2 border-amber-300 transition-all scale-105 active:scale-95"
          >
            <span className="text-xl">✋</span>
            <span>تفاعل</span>
          </button>
        )}

        {/* Row of Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Flashlight Button */}
          <button
            onTouchStart={toggleFlashlight}
            onClick={toggleFlashlight}
            className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all shadow-md ${
              isFlashlightOn
                ? 'bg-amber-950/70 border-amber-500/80 text-amber-300 shadow-amber-950/50'
                : 'bg-slate-900/60 border-slate-700 text-slate-400'
            }`}
          >
            <span className="text-lg">🔦</span>
            <span>كشاف</span>
          </button>

          {/* Crouch Button */}
          <button
            onTouchStart={toggleCrouch}
            onClick={toggleCrouch}
            className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all shadow-md ${
              isCrouched
                ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300'
                : 'bg-slate-900/60 border-slate-700 text-slate-400'
            }`}
          >
            <span className="text-lg">🧎</span>
            <span>انحناء</span>
          </button>

          {/* Sprint Button (Hold to run) */}
          <button
            onTouchStart={handleSprintStart}
            onTouchEnd={handleSprintEnd}
            onMouseDown={handleSprintStart}
            onMouseUp={handleSprintEnd}
            className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-600/80 text-red-200 active:bg-red-700 active:text-white flex flex-col items-center justify-center text-xs font-extrabold shadow-lg transition-transform active:scale-95"
          >
            <span className="text-xl">🏃</span>
            <span>ركض</span>
          </button>
        </div>
      </div>
    </div>
  );
};
