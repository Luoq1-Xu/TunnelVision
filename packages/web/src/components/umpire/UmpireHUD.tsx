"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePitchStore } from "@/lib/store";
import { classifyPitch } from "@/lib/umpire";

export default function UmpireHUD() {
  const umpire = usePitchStore((s) => s.umpire);
  const makeCall = usePitchStore((s) => s.makeCall);
  const beginPlay = usePitchStore((s) => s.beginPlay);
  const exitUmpireMode = usePitchStore((s) => s.exitUmpireMode);

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [feedback, setFeedback] = useState<{
    correct: boolean;
    call: string;
  } | null>(null);

  const pitchNumber = umpire.currentIndex + 1;
  const totalPitches = umpire.pitchQueue.length;

  const handleReady = useCallback(() => {
    setCountdown(3);
  }, []);

  // Run the countdown timer
  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      beginPlay();
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, beginPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleCall = useCallback(
    (call: "ball" | "strike") => {
      // Peek at what the result will be before making the call
      const pitches = usePitchStore.getState().pitches;
      const pitchId = umpire.pitchQueue[umpire.currentIndex];
      const pitch = pitches.find((p) => p.id === pitchId);
      if (!pitch) return;

      const truth = classifyPitch(pitch.trajectory);
      const correct = call === truth;

      setFeedback({ correct, call });

      // Delay the actual state transition to show feedback
      setTimeout(() => {
        makeCall(call);
        setFeedback(null);
      }, 800);
    },
    [umpire.currentIndex, umpire.pitchQueue, makeCall]
  );

  // Ready phase: show "Press when ready" prompt
  if (umpire.phase === "ready") {
    return (
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        {/* Top bar */}
        <div className="flex items-center justify-end">
          <button
            onClick={exitUmpireMode}
            className="bg-zinc-900/80 backdrop-blur rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors pointer-events-auto"
          >
            Exit
          </button>
        </div>

        {/* Center content */}
        <div className="flex-1 flex items-center justify-center">
          {countdown !== null ? (
            <div className="text-8xl font-black text-white animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
              {countdown}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="bg-zinc-900/80 backdrop-blur rounded-xl px-8 py-4 text-center">
                <p className="text-lg font-semibold text-zinc-100 mb-1">
                  Umpire Mode
                </p>
                <p className="text-sm text-zinc-400">
                  {totalPitches} pitch{totalPitches !== 1 ? "es" : ""} queued
                </p>
              </div>
              <button
                onClick={handleReady}
                className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-10 py-4 text-lg font-bold shadow-lg shadow-amber-600/30 hover:scale-105 transition-all pointer-events-auto"
              >
                Ready
              </button>
            </div>
          )}
        </div>

        {/* Spacer for bottom */}
        <div />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="bg-zinc-900/80 backdrop-blur rounded-lg px-4 py-2 pointer-events-auto">
          <span className="text-sm font-medium text-zinc-100">
            Pitch {pitchNumber} of {totalPitches}
          </span>
        </div>
        <button
          onClick={exitUmpireMode}
          className="bg-zinc-900/80 backdrop-blur rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors pointer-events-auto"
        >
          Exit
        </button>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col items-center gap-3">
        {/* Feedback flash */}
        {feedback && (
          <div
            className={`rounded-lg px-6 py-3 text-lg font-bold ${
              feedback.correct
                ? "bg-green-600/90 text-white"
                : "bg-red-600/90 text-white"
            }`}
          >
            {feedback.correct ? "Correct!" : "Wrong!"}
          </div>
        )}

        {/* Ball / Strike buttons */}
        {!feedback && (
          <div className="flex gap-4 pointer-events-auto">
            <button
              onClick={() => handleCall("ball")}
              disabled={!umpire.awaitingCall}
              className={`rounded-xl px-8 py-4 text-lg font-bold transition-all ${
                umpire.awaitingCall
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 scale-100 hover:scale-105"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              BALL
            </button>
            <button
              onClick={() => handleCall("strike")}
              disabled={!umpire.awaitingCall}
              className={`rounded-xl px-8 py-4 text-lg font-bold transition-all ${
                umpire.awaitingCall
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 scale-100 hover:scale-105"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              STRIKE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
