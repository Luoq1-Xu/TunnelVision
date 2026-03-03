"use client";

import { usePitchStore } from "@/lib/store";
import { computeAccuracy } from "@/lib/umpire";

export default function UmpireResults() {
  const umpire = usePitchStore((s) => s.umpire);
  const startReview = usePitchStore((s) => s.startReview);
  const exitUmpireMode = usePitchStore((s) => s.exitUmpireMode);

  const stats = computeAccuracy(umpire.calls);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-zinc-100 mb-6">
          Umpire Mode Results
        </h2>

        {/* Overall score */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-zinc-100">
            {stats.correct}/{stats.total}
          </div>
          <div className="text-lg text-zinc-400 mt-1">
            {stats.percentage.toFixed(1)}% Accuracy
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-800 rounded-xl p-4 text-center">
            <div className="text-sm text-zinc-400 mb-1">Strikes</div>
            <div className="text-xl font-bold text-red-400">
              {stats.strikeCorrect}/{stats.strikeTotal}
            </div>
            <div className="text-xs text-zinc-500">
              {stats.strikeTotal > 0
                ? `${stats.strikePercentage.toFixed(1)}%`
                : "N/A"}
            </div>
          </div>
          <div className="bg-zinc-800 rounded-xl p-4 text-center">
            <div className="text-sm text-zinc-400 mb-1">Balls</div>
            <div className="text-xl font-bold text-blue-400">
              {stats.ballCorrect}/{stats.ballTotal}
            </div>
            <div className="text-xs text-zinc-500">
              {stats.ballTotal > 0
                ? `${stats.ballPercentage.toFixed(1)}%`
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={startReview}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Review Pitches
          </button>
          <button
            onClick={exitUmpireMode}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
