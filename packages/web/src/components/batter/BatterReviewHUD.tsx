"use client";

import { usePitchStore } from "@/lib/store";
import { PITCH_COLORS } from "@/types/pitch";

export default function BatterReviewHUD() {
  const batter = usePitchStore((s) => s.batter);
  const pitches = usePitchStore((s) => s.pitches);
  const batterReviewNext = usePitchStore((s) => s.batterReviewNext);
  const batterReviewPrev = usePitchStore((s) => s.batterReviewPrev);
  const exitBatterMode = usePitchStore((s) => s.exitBatterMode);

  const pitchId = batter.pitchQueue[batter.reviewIndex];
  const pitch = pitches.find((p) => p.id === pitchId);
  const call = batter.calls[batter.reviewIndex];

  const isFirst = batter.reviewIndex === 0;
  const isLast = batter.reviewIndex === batter.pitchQueue.length - 1;

  const handleReplay = () => {
    window.dispatchEvent(new CustomEvent("batter-replay"));
  };

  if (!pitch || !call) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="bg-zinc-900/80 backdrop-blur rounded-lg px-4 py-2 pointer-events-auto">
          <span className="text-sm font-medium text-zinc-100">
            Review: Pitch {batter.reviewIndex + 1} of{" "}
            {batter.pitchQueue.length}
          </span>
        </div>
        <button
          onClick={exitBatterMode}
          className="bg-zinc-900/80 backdrop-blur rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors pointer-events-auto"
        >
          Exit Review
        </button>
      </div>

      {/* Bottom panel */}
      <div className="flex flex-col items-center gap-3 pointer-events-auto">
        {/* Pitch info + call result */}
        <div
          className={`rounded-xl px-6 py-4 backdrop-blur ${
            call.correct ? "bg-green-900/70" : "bg-red-900/70"
          }`}
        >
          <div className="flex items-center gap-3 justify-center mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: PITCH_COLORS[pitch.pitch_type] ?? "#888",
              }}
            />
            <span className="font-medium text-zinc-100">
              {pitch.pitch_type}
            </span>
            <span className="text-zinc-300">
              {pitch.velocity_mph.toFixed(1)} mph
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm justify-center">
            <span className="text-zinc-300">
              Your call:{" "}
              <span
                className={`font-bold uppercase ${
                  call.userCall === "strike"
                    ? "text-red-400"
                    : "text-blue-400"
                }`}
              >
                {call.userCall}
              </span>
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-300">
              Actual:{" "}
              <span
                className={`font-bold uppercase ${
                  call.truth === "strike" ? "text-red-400" : "text-blue-400"
                }`}
              >
                {call.truth}
              </span>
            </span>
            <span
              className={`font-bold text-lg ${
                call.correct ? "text-green-400" : "text-red-400"
              }`}
            >
              {call.correct ? "\u2713" : "\u2717"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={batterReviewPrev}
            disabled={isFirst}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isFirst
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
            }`}
          >
            Prev
          </button>
          <button
            onClick={handleReplay}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors"
          >
            Replay
          </button>
          <button
            onClick={batterReviewNext}
            disabled={isLast}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isLast
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
