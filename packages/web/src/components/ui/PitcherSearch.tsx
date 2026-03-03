"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchPlayers,
  fetchPitcherPitchesById,
  PlayerSearchResult,
} from "@/lib/api";
import { usePitchStore } from "@/lib/store";

export default function PitcherSearch() {
  const { setPitches, setLoading, setError, loading, loadDemo } =
    usePitchStore();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlayerSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlayer, setSelectedPlayer] =
    useState<PlayerSearchResult | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const [startDt, setStartDt] = useState("2025-01-01");
  const [endDt, setEndDt] = useState("2025-06-30");
  const [limit, setLimit] = useState(20);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const results = await searchPlayers(q.trim());
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setHighlightIndex(-1);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPlayer) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedPlayer, performSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (player: PlayerSearchResult) => {
    setSelectedPlayer(player);
    setQuery(`${player.first_name} ${player.last_name}`);
    setShowDropdown(false);
    setSuggestions([]);
    setHighlightIndex(-1);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (selectedPlayer) {
      setSelectedPlayer(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter" && selectedPlayer) {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedPlayer) return;

    setLoading(true);
    setError(null);
    try {
      const pitches = await fetchPitcherPitchesById(
        selectedPlayer.mlbam_id,
        startDt,
        endDt,
        limit
      );
      if (pitches.length === 0) {
        setError("No pitches found for this pitcher/date range.");
        setLoading(false);
        return;
      }
      setPitches(pitches, "statcast");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch pitches"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-zinc-300">
        Load Statcast Data
      </h2>

      {/* Unified player search */}
      <div className="relative" ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search player name..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && !selectedPlayer) {
              setShowDropdown(true);
            }
          }}
          className="w-full rounded bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
        />

        {selectedPlayer && (
          <button
            onClick={() => {
              setSelectedPlayer(null);
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            aria-label="Clear selection"
          >
            ✕
          </button>
        )}

        {showDropdown && (
          <div className="absolute z-50 mt-1 w-full rounded border border-zinc-700 bg-zinc-900 shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((player, idx) => (
              <button
                key={player.mlbam_id}
                onClick={() => handleSelect(player)}
                className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                  idx === highlightIndex
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span className="font-medium">
                  {player.first_name} {player.last_name}
                </span>
                {player.played_first != null && player.played_last != null && (
                  <span className="ml-2 text-zinc-500">
                    ({player.played_first}&ndash;{player.played_last})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={startDt}
          onChange={(e) => setStartDt(e.target.value)}
          className="rounded bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-600"
        />
        <input
          type="date"
          value={endDt}
          onChange={(e) => setEndDt(e.target.value)}
          className="rounded bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-600"
        />
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={200}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-16 rounded bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-600"
        />
        <span className="self-center text-xs text-zinc-500">max pitches</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSearch}
          disabled={loading || !selectedPlayer}
          className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Fetch Pitches"}
        </button>
        <button
          onClick={loadDemo}
          className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
        >
          Demo
        </button>
      </div>
    </div>
  );
}
