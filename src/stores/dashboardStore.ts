import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

interface DashboardStore {
  view: "table" | "grid";
  setView: (view: "table" | "grid") => void;
  showClosedJobs: boolean;
  toggleShowClosedJobs: () => void;
}

export const dashboardStore = createStore<DashboardStore>()((set) => ({
  view: "table",
  setView: (view) => set({ view }),
  showClosedJobs: true,
  toggleShowClosedJobs: () =>
    set((state) => ({ showClosedJobs: !state.showClosedJobs })),
}));

// Typed selector hooks — one value per call as required by the spec
export const useView = () => useStore(dashboardStore, (s) => s.view);
export const useSetView = () => useStore(dashboardStore, (s) => s.setView);
export const useShowClosedJobs = () => useStore(dashboardStore, (s) => s.showClosedJobs);
export const useToggleShowClosedJobs = () => useStore(dashboardStore, (s) => s.toggleShowClosedJobs);