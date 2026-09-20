"use client";

import { create } from "zustand";

type UIState = {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  newProjectOpen: boolean;
  setNewProjectOpen: (open: boolean) => void;
};

/** Global chrome state (command palette, mobile nav, modals). */
export const useUI = create<UIState>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  newProjectOpen: false,
  setNewProjectOpen: (newProjectOpen) => set({ newProjectOpen }),
}));
