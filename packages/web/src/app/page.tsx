"use client";

import dynamic from "next/dynamic";
import { usePitchStore } from "@/lib/store";
import { PITCH_COLORS } from "@/types/pitch";
import PitcherSearch from "@/components/ui/PitcherSearch";
import { ViewMode } from "@/lib/store";
import UmpireHUD from "@/components/umpire/UmpireHUD";
import UmpireResults from "@/components/umpire/UmpireResults";
import UmpireReviewHUD from "@/components/umpire/UmpireReviewHUD";
import BatterHUD from "@/components/batter/BatterHUD";
import BatterResults from "@/components/batter/BatterResults";
import BatterReviewHUD from "@/components/batter/BatterReviewHUD";

const PitchScene = dynamic(() => import("@/components/scene/PitchScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-zinc-400">
      Loading 3D scene...
    </div>
  ),
});

export default function Home() {
  const {
    pitches,
    selectedIds,
    togglePitch,
    selectAll,
    clearAll,
    error,
    source,
    viewMode,
    setViewMode,
    umpire,
    startUmpireMode,
    batter,
    startBatterMode,
  } = usePitchStore();

  const visiblePitches = pitches.filter((p) => selectedIds.includes(p.id));

  // Umpire derived state
  const isUmpireActive = umpire.phase !== "idle";
  const isReady = umpire.phase === "ready";
  const isPlaying = umpire.phase === "playing";
  const allPitchesDone =
    isPlaying && umpire.currentIndex >= umpire.pitchQueue.length;
  const isReviewing = umpire.phase === "reviewing";

  // Batter derived state
  const isBatterActive = batter.phase !== "idle";
  const batterReady = batter.phase === "ready";
  const batterPlaying = batter.phase === "playing";
  const batterAllDone =
    batterPlaying && batter.currentIndex >= batter.pitchQueue.length;
  const batterReviewing = batter.phase === "reviewing";

  const canStartModes =
    selectedIds.length >= 1 && selectedIds.length <= 20;
  const isModeActive = isUmpireActive || isBatterActive;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar - hidden during umpire/batter mode */}
      {!isModeActive && (
        <div className="w-72 shrink-0 border-r border-zinc-800 p-4 flex flex-col gap-4 overflow-y-auto">
          <h1 className="text-xl font-bold">TunnelVision</h1>
          <p className="text-sm text-zinc-400">
            Pitch tunneling visualization
          </p>

          <PitcherSearch />

          {/* View mode */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 mb-2">
              Camera View
            </h2>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  { key: "default", label: "Default" },
                  { key: "catcher", label: "Catcher" },
                  { key: "umpire", label: "Umpire" },
                  { key: "rhb", label: "RHB" },
                  { key: "lhb", label: "LHB" },
                ] as { key: ViewMode; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === key
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={startUmpireMode}
              disabled={!canStartModes}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                canStartModes
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              Start Umpire Mode
              {selectedIds.length > 0 && (
                <span className="text-xs ml-1 opacity-75">
                  ({selectedIds.length} pitch
                  {selectedIds.length !== 1 ? "es" : ""})
                </span>
              )}
            </button>
            <button
              onClick={startBatterMode}
              disabled={!canStartModes}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                canStartModes
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              Start Batter Mode
              {selectedIds.length > 0 && (
                <span className="text-xs ml-1 opacity-75">
                  ({selectedIds.length} pitch
                  {selectedIds.length !== 1 ? "es" : ""})
                </span>
              )}
            </button>
          </div>
          {selectedIds.length > 20 && (
            <p className="text-xs text-amber-400 -mt-2">
              Max 20 pitches for umpire/batter mode
            </p>
          )}

          {error && (
            <div className="rounded bg-red-900/50 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Pitch list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-zinc-300">
                Pitches ({pitches.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Select all
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Clear all
                </button>
              </div>
            </div>
            {source === "statcast" && (
              <p className="text-xs text-zinc-500 mb-2">
                Source: MLB Statcast
              </p>
            )}
            <div className="flex flex-col gap-1">
              {pitches.map((pitch) => (
                <button
                  key={pitch.id}
                  onClick={() => togglePitch(pitch.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    selectedIds.includes(pitch.id)
                      ? "bg-zinc-800"
                      : "bg-zinc-900 opacity-50"
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        PITCH_COLORS[pitch.pitch_type] ?? "#888",
                    }}
                  />
                  <span className="font-medium">{pitch.pitch_type}</span>
                  <span className="text-zinc-400">
                    {pitch.velocity_mph.toFixed(1)} mph
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tunnel metrics */}
          {visiblePitches.some((p) => p.tunnel_metrics) && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-300 mb-2">
                Tunnel Metrics
              </h2>
              {visiblePitches
                .filter((p) => p.tunnel_metrics)
                .map((pitch) => (
                  <div
                    key={pitch.id}
                    className="mb-2 rounded-lg bg-zinc-800 p-3 text-xs"
                  >
                    <div className="font-medium mb-1 flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            PITCH_COLORS[pitch.pitch_type] ?? "#888",
                        }}
                      />
                      {pitch.pitch_type} — {pitch.velocity_mph.toFixed(1)} mph
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Tunnel diff:</span>
                      <span>
                        {pitch.tunnel_metrics!.tunnel_differential_inches.toFixed(
                          1
                        )}
                        &quot;
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Plate diff:</span>
                      <span>
                        {pitch.tunnel_metrics!.plate_differential_inches.toFixed(
                          1
                        )}
                        &quot;
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Break diff:</span>
                      <span>
                        {pitch.tunnel_metrics!.break_differential_inches.toFixed(
                          1
                        )}
                        &quot;
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 3D Canvas + HUD overlays */}
      <div className="flex-1 relative min-w-0 overflow-hidden">
        <PitchScene pitches={visiblePitches} />

        {/* Umpire play HUD */}
        {(isReady || (isPlaying && !allPitchesDone)) && <UmpireHUD />}

        {/* Umpire results */}
        {allPitchesDone && <UmpireResults />}

        {/* Umpire review HUD */}
        {isReviewing && <UmpireReviewHUD />}

        {/* Batter play HUD */}
        {(batterReady || (batterPlaying && !batterAllDone)) && <BatterHUD />}

        {/* Batter results */}
        {batterAllDone && <BatterResults />}

        {/* Batter review HUD */}
        {batterReviewing && <BatterReviewHUD />}
      </div>
    </div>
  );
}
