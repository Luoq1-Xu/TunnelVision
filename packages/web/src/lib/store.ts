import { create } from "zustand";
import { Pitch, UmpireCall } from "@/types/pitch";
import { DEMO_PITCHES } from "./demo-data";
import { classifyPitch } from "./umpire";

export type ViewMode = "default" | "lhb" | "rhb" | "umpire" | "catcher" | "batter_lhb" | "batter_rhb";

export type UmpirePhase = "idle" | "ready" | "playing" | "reviewing";

export interface UmpireState {
  phase: UmpirePhase;
  pitchQueue: string[];
  currentIndex: number;
  calls: UmpireCall[];
  awaitingCall: boolean;
  reviewIndex: number;
}

const DEFAULT_UMPIRE: UmpireState = {
  phase: "idle",
  pitchQueue: [],
  currentIndex: 0,
  calls: [],
  awaitingCall: false,
  reviewIndex: 0,
};

export type BatterPhase = "idle" | "ready" | "playing" | "reviewing";

export interface BatterState {
  phase: BatterPhase;
  hand: "left" | "right";
  pitchQueue: string[];
  currentIndex: number;
  calls: UmpireCall[];
  awaitingCall: boolean;
  reviewIndex: number;
}

const DEFAULT_BATTER: BatterState = {
  phase: "idle",
  hand: "right",
  pitchQueue: [],
  currentIndex: 0,
  calls: [],
  awaitingCall: false,
  reviewIndex: 0,
};

interface PitchStore {
  pitches: Pitch[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  source: "demo" | "statcast";
  viewMode: ViewMode;
  umpire: UmpireState;
  batter: BatterState;

  setPitches: (pitches: Pitch[], source: "demo" | "statcast") => void;
  togglePitch: (id: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadDemo: () => void;
  setViewMode: (mode: ViewMode) => void;

  startUmpireMode: () => void;
  beginPlay: () => void;
  makeCall: (call: "ball" | "strike") => void;
  setAwaitingCall: (awaiting: boolean) => void;
  exitUmpireMode: () => void;
  startReview: () => void;
  reviewNext: () => void;
  reviewPrev: () => void;
  replayReviewPitch: () => void;

  startBatterMode: () => void;
  setBatterHand: (hand: "left" | "right") => void;
  beginBatterPlay: () => void;
  makeBatterCall: (call: "ball" | "strike") => void;
  setBatterAwaitingCall: (awaiting: boolean) => void;
  exitBatterMode: () => void;
  startBatterReview: () => void;
  batterReviewNext: () => void;
  batterReviewPrev: () => void;
}

export const usePitchStore = create<PitchStore>((set, get) => ({
  pitches: DEMO_PITCHES,
  selectedIds: DEMO_PITCHES.map((p) => p.id),
  loading: false,
  error: null,
  source: "demo",
  viewMode: "default",
  umpire: DEFAULT_UMPIRE,
  batter: DEFAULT_BATTER,

  setPitches: (pitches, source) =>
    set({
      pitches,
      selectedIds: pitches.map((p) => p.id),
      source,
      error: null,
    }),

  togglePitch: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((p) => p !== id)
        : [...state.selectedIds, id],
    })),

  selectAll: () =>
    set((state) => ({
      selectedIds: state.pitches.map((p) => p.id),
    })),

  clearAll: () => set({ selectedIds: [] }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setViewMode: (viewMode) => set({ viewMode }),

  loadDemo: () =>
    set({
      pitches: DEMO_PITCHES,
      selectedIds: DEMO_PITCHES.map((p) => p.id),
      source: "demo",
      error: null,
    }),

  startUmpireMode: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0 || selectedIds.length > 20) return;

    set({
      viewMode: "umpire",
      umpire: {
        phase: "ready",
        pitchQueue: [...selectedIds],
        currentIndex: 0,
        calls: [],
        awaitingCall: false,
        reviewIndex: 0,
      },
    });
  },

  beginPlay: () =>
    set((state) => ({
      umpire: { ...state.umpire, phase: "playing" },
    })),

  makeCall: (call) => {
    const { umpire, pitches } = get();
    const pitchId = umpire.pitchQueue[umpire.currentIndex];
    const pitch = pitches.find((p) => p.id === pitchId);
    if (!pitch) return;

    const truth = classifyPitch(pitch.trajectory);
    const entry: UmpireCall = {
      pitchId,
      userCall: call,
      truth,
      correct: call === truth,
    };

    set({
      umpire: {
        ...umpire,
        calls: [...umpire.calls, entry],
        currentIndex: umpire.currentIndex + 1,
        awaitingCall: false,
      },
    });
  },

  setAwaitingCall: (awaiting) =>
    set((state) => ({
      umpire: { ...state.umpire, awaitingCall: awaiting },
    })),

  exitUmpireMode: () =>
    set({
      viewMode: "default",
      umpire: DEFAULT_UMPIRE,
    }),

  startReview: () =>
    set((state) => ({
      umpire: {
        ...state.umpire,
        phase: "reviewing",
        reviewIndex: 0,
      },
    })),

  reviewNext: () =>
    set((state) => ({
      umpire: {
        ...state.umpire,
        reviewIndex: Math.min(
          state.umpire.reviewIndex + 1,
          state.umpire.pitchQueue.length - 1
        ),
      },
    })),

  reviewPrev: () =>
    set((state) => ({
      umpire: {
        ...state.umpire,
        reviewIndex: Math.max(state.umpire.reviewIndex - 1, 0),
      },
    })),

  replayReviewPitch: () =>
    set((state) => ({
      umpire: {
        ...state.umpire,
        // Toggle reviewIndex to force AnimatedBall remount by changing key
        // We use a sentinel: set reviewIndex to -1 briefly, then back
        reviewIndex: state.umpire.reviewIndex,
      },
    })),

  // --- Batter mode actions ---

  startBatterMode: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0 || selectedIds.length > 20) return;

    set({
      batter: {
        ...DEFAULT_BATTER,
        phase: "ready",
        pitchQueue: [...selectedIds],
      },
    });
  },

  setBatterHand: (hand) =>
    set((state) => {
      const viewMode = hand === "left" ? "batter_lhb" : "batter_rhb";
      return {
        viewMode,
        batter: { ...state.batter, hand },
      };
    }),

  beginBatterPlay: () =>
    set((state) => ({
      batter: { ...state.batter, phase: "playing" },
    })),

  makeBatterCall: (call) => {
    const { batter, pitches } = get();
    const pitchId = batter.pitchQueue[batter.currentIndex];
    const pitch = pitches.find((p) => p.id === pitchId);
    if (!pitch) return;

    const truth = classifyPitch(pitch.trajectory);
    const entry: UmpireCall = {
      pitchId,
      userCall: call,
      truth,
      correct: call === truth,
    };

    set({
      batter: {
        ...batter,
        calls: [...batter.calls, entry],
        currentIndex: batter.currentIndex + 1,
        awaitingCall: false,
      },
    });
  },

  setBatterAwaitingCall: (awaiting) =>
    set((state) => ({
      batter: { ...state.batter, awaitingCall: awaiting },
    })),

  exitBatterMode: () =>
    set({
      viewMode: "default",
      batter: DEFAULT_BATTER,
    }),

  startBatterReview: () =>
    set((state) => ({
      batter: {
        ...state.batter,
        phase: "reviewing",
        reviewIndex: 0,
      },
    })),

  batterReviewNext: () =>
    set((state) => ({
      batter: {
        ...state.batter,
        reviewIndex: Math.min(
          state.batter.reviewIndex + 1,
          state.batter.pitchQueue.length - 1
        ),
      },
    })),

  batterReviewPrev: () =>
    set((state) => ({
      batter: {
        ...state.batter,
        reviewIndex: Math.max(state.batter.reviewIndex - 1, 0),
      },
    })),
}));
