import { create } from "zustand";

interface DashboardStore {
  view: "table" | "grid";
  setView: (view: "table" | "grid") => void;
  showClosedJobs: boolean;
  toggleShowClosedJobs: () => void;
}

const useDashboardStore = create<DashboardStore>()((set) => ({
  view: "table",
  setView: (view) => set({ view }),
  showClosedJobs: true,
  toggleShowClosedJobs: () =>
    set((state) => ({ showClosedJobs: !state.showClosedJobs })),
}));

// Typed selector hooks — one useStore call per value as required by the spec
export const useView = () => useDashboardStore((s) => s.view);
export const useSetView = () => useDashboardStore((s) => s.setView);
export const useShowClosedJobs = () => useDashboardStore((s) => s.showClosedJobs);
export const useToggleShowClosedJobs = () => useDashboardStore((s) => s.toggleShowClosedJobs);