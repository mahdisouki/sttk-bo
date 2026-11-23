import { create } from "zustand";

export type View =
  | "dashboard"
  | "orders"
  | "catalogue"
  | "treatments"
  | "availability"
  | "pricing"
  | "promos"
  | "partners"
  | "users"
  | "offline"
  | "settings"
  | "audit"
  | "notifications";

export type Modal = "cancel" | "approve" | "publish" | "payment" | "offline" | null;

type UiState = {
  view: View;
  modal: Modal;
  toast: string;
  profileOpen: boolean;
  pageLoading: boolean;
  setView: (view: View) => void;
  navigate: (view: View) => void;
  openModal: (modal: Exclude<Modal, null>) => void;
  closeModal: () => void;
  notify: (message: string) => void;
  clearToast: () => void;
  setProfileOpen: (open: boolean) => void;
  toggleProfile: () => void;
};

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let navTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiState>((set, get) => ({
  view: "dashboard",
  modal: null,
  toast: "",
  profileOpen: false,
  pageLoading: false,

  setView: (view) => set({ view }),

  navigate: (next) => {
    if (next === get().view) return;
    if (navTimer) clearTimeout(navTimer);
    set({ pageLoading: true, view: next, profileOpen: false });
    navTimer = setTimeout(() => set({ pageLoading: false }), 280);
  },

  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),

  notify: (message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: "" }), 3200);
  },

  clearToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: "" });
  },

  setProfileOpen: (open) => set({ profileOpen: open }),
  toggleProfile: () => set((state) => ({ profileOpen: !state.profileOpen })),
}));
